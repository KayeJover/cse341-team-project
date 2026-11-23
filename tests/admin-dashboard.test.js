import { describe, expect, test } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import path from "path";

import adminRouter from "../src/routes/admin-routes.js";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src/views"));

app.use(session({
    secret: "test-session-secret",
    resave: false,
    saveUninitialized: false,
}));

app.use((req, res, next) => {
    res.locals.NODE_ENV = "test";
    next();
});

// Test-only route to create authenticated sessions.
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

app.use("/", adminRouter);

describe("Admin Dashboard", () => {
    test("redirects signed-out users to login", async () => {
        await request(app)
            .get("/admin")
            .expect(302)
            .expect("Location", "/login");
    });

    test("shows the 403 page to customers", async () => {
        const agent = request.agent(app);

        await agent.post("/__test-login/customer").expect(200);

        const response = await agent
            .get("/admin")
            .expect(403);

        expect(response.text).toContain("403 - Access Denied");
    });

    test("allows administrators to view the dashboard", async () => {
        const agent = request.agent(app);

        await agent.post("/__test-login/admin").expect(200);

        const response = await agent
            .get("/admin")
            .expect(200);

        expect(response.text).toContain(
            "Welcome to the Admin Dashboard"
        );
        expect(response.text).toContain("Test User");
    });
});
