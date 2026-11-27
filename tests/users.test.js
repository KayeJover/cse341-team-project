import { beforeEach, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import User from "../src/models/schemas/users.js";
import Role from "../src/models/schemas/roles.js";

let admin;
let customer;

async function signIn(username) {
    const agent = request.agent(app);
    await agent.post("/api/auth/login")
        .send({ username, password: "test-password" })
        .expect(200);
    return agent;
}

beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
        username: "admin-user",
        displayName: "Admin User",
        email: "admin@example.com",
        password: "test-password",
    }).expect(201);

    const adminRole = await Role.findOne({ name: "admin" });
    const customerRole = await Role.findOne({ name: "customer" });
    await User.updateOne({ username: "admin-user" }, { role: adminRole._id });
    const account = await User.findOne({ username: "admin-user" });
    await User.insertMany(Array.from({ length: 12 }, (_, index) => {
        const suffix = String(11 - index).padStart(2, "0");
        return {
            displayName: `Passenger ${suffix}`,
            username: `passenger${suffix}`,
            email: `p${suffix}@example.com`,
            role: customerRole._id,
            passwordHash: account.passwordHash,
        };
    }));

    admin = await signIn("admin-user");
    customer = await signIn("passenger00");
});

test("only admins can open User Admin or read its API", async () => {
    await request(app).get("/users").expect(302).expect("Location", "/login");
    await request(app).get("/api/users").expect(401);
    await customer.get("/users").expect(403);
    await customer.get("/api/users").expect(403);
    expect((await admin.get("/admin").expect(200)).text).toContain('href="/users"');
    expect((await admin.get("/users").expect(200)).text).toContain("User Admin");
});

test("returns two pages sorted by username and exposes only list fields", async () => {
    const first = (await admin.get("/api/users").expect(200)).body;
    const second = (await admin.get("/api/users?page=2").expect(200)).body;
    expect(first.pagination).toMatchObject({
        currentPage: 1, itemsPerPage: 10, totalItems: 13, totalPages: 2,
    });
    expect(first.users).toHaveLength(10);
    expect(second.users).toHaveLength(3);
    const users = [...first.users, ...second.users];
    expect(users.map((user) => user.username)).toEqual([
        "admin-user",
        ...Array.from({ length: 12 }, (_, i) => `passenger${String(i).padStart(2, "0")}`),
    ]);
    expect(Object.keys(users[0]).sort()).toEqual(["displayName", "email", "id", "role", "username"]);
    expect(users[0].role).toBe("admin");
    expect((await admin.get("/api/users?page=3").expect(200)).body.users).toEqual([]);
    expect((await admin.get("/api/users?limit=3").expect(200)).body.users).toHaveLength(3);
});

test("rejects invalid or repeated pagination values", async () => {
    for (const query of ["page=0", "page=1.5", "page=1&page=2", "limit=11", "limit=foo"]) {
        await admin.get(`/api/users?${query}`).expect(400);
    }
});

test("matches keyword fragments literally and case-insensitively across list fields", async () => {
    for (const search of ["Passenger 03", "PASSENGER03", "P03@EXAMPLE.COM"]) {
        const response = await admin.get("/api/users").query({ search }).expect(200);
        expect(response.body.users.map((user) => user.username)).toEqual(["passenger03"]);
    }
    const literal = await admin.get("/api/users").query({ search: ".*" }).expect(200);
    expect(literal.body.users).toEqual([]);
    expect(literal.body.pagination.totalItems).toBe(0);
    const blank = await admin.get("/api/users").query({ search: " " }).expect(200);
    expect(blank.body.pagination.totalItems).toBe(13);
});

test("combines role and search before counting and paging", async () => {
    const query = { role: "customer", search: "  EXAMPLE.COM  " };
    const first = (await admin.get("/api/users").query(query).expect(200)).body;
    const second = (await admin.get("/api/users").query({ ...query, page: 2 }).expect(200)).body;
    expect(first.users).toHaveLength(10);
    expect(second.users).toHaveLength(2);
    expect(second.pagination).toMatchObject({
        currentPage: 2, totalItems: 12, totalPages: 2, role: "customer", search: "EXAMPLE.COM",
    });
    expect([...first.users, ...second.users].every((user) => user.role === "customer")).toBe(true);
    const admins = await admin.get("/api/users?role=admin").expect(200);
    expect(admins.body.users.map((user) => user.username)).toEqual(["admin-user"]);
});

test("rejects invalid filters and protects filtered responses", async () => {
    for (const query of ["role=owner", "role=admin&role=customer", "search=a&search=b"]) {
        await admin.get(`/api/users?${query}`).expect(400);
    }
    await admin.get("/api/users").query({ search: "a".repeat(101) }).expect(400);
    await customer.get("/api/users?role=admin").expect(403);
});
