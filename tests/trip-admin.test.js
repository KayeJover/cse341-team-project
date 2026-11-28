
import { describe, expect, test } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import path from "node:path";

import adminRouter from "../src/routes/admin-routes.js";
import apiRouter from "../src/routes/api-routes.js";
import { loadSessionUser } from "../src/middleware/auth.js";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src/views"));

app.use(express.json());

app.use(
    session({
        secret: "trip-admin-test-secret",
        resave: false,
        saveUninitialized: false,
    })
);

app.use((req, res, next) => {
    res.locals.NODE_ENV = "test";
    next();
});

// Test-only authentication route.
app.post("/__test-login/:role", (req, res) => {
    req.session.user = {
        id: "test-user",
        displayName: "Test User",
        username: "testuser",
        email: "test@example.com",
        role: req.params.role,
    };

    res.sendStatus(200);
});

app.use(loadSessionUser);

app.use("/", adminRouter);
app.use("/api", apiRouter);

describe("Protected Trip Administration", () => {
    test("redirects unauthenticated users to login", async () => {
        await request(app)
            .get("/admin/trips")
            .expect(302)
            .expect("Location", "/login");
    });

    test("denies access to customers", async () => {
        const agent = request.agent(app);

        await agent
            .post("/__test-login/customer")
            .expect(200);

        const response = await agent
            .get("/admin/trips")
            .expect(403);

        expect(response.text).toContain("Access Denied");
    });

    test("allows administrators to access trip management", async () => {
        const agent = request.agent(app);

        await agent
            .post("/__test-login/admin")
            .expect(200);

        const response = await agent
            .get("/admin/trips")
            .expect(200);

        expect(response.text).toContain("Trip Administration");
        expect(response.text).toContain("All Trips");
        expect(response.text).toContain("trip-admin.js");
    });

    test("includes the Manage trips dashboard link", async () => {
        const agent = request.agent(app);

        await agent
            .post("/__test-login/admin")
            .expect(200);

        const response = await agent
            .get("/admin")
            .expect(200);

        expect(response.text).toContain("/admin/trips");
    });

    test("rejects unauthenticated trip updates", async () => {
        await request(app)
            .put("/api/trips/test-trip")
            .send({ name: "Updated Trip" })
            .expect(401);
    });

    test("rejects unauthenticated trip deletion", async () => {
        await request(app)
            .delete("/api/trips/test-trip")
            .expect(401);
    });

    test("prevents customers from updating trips", async () => {
        const agent = request.agent(app);

        await agent
            .post("/__test-login/customer")
            .expect(200);

        await agent
            .put("/api/trips/test-trip")
            .send({ name: "Updated Trip" })
            .expect(403);
    });

    test("prevents customers from deleting trips", async () => {
        const agent = request.agent(app);

        await agent
            .post("/__test-login/customer")
            .expect(200);

        await agent
            .delete("/api/trips/test-trip")
            .expect(403);
    });

    test("protects administrative schedule data", async () => {
        await request(app)
            .get("/api/admin/schedules")
            .expect(401);
    });

    test("prevents customers from reassigning schedules", async () => {
        const agent = request.agent(app);

        await agent
            .post("/__test-login/customer")
            .expect(200);

        await agent
            .put("/api/admin/schedules/1")
            .send({ tripId: "test-trip" })
            .expect(403);
    });

    test("rejects invalid trip update fields", async () => {
        const agent = request.agent(app);

        await agent
            .post("/__test-login/admin")
            .expect(200);

        await agent
            .put("/api/trips/test-trip")
            .send({ unauthorizedField: "invalid" })
            .expect(400);
    });
});
