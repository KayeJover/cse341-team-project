

import { describe, expect, test } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import bcrypt from "bcrypt";

import apiRouter from "../src/routes/api-routes.js";
import User from "../src/models/schemas/users.js";
import Role from "../src/models/schemas/roles.js";
import { getDb } from "../src/db/connect.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "test-session-secret",
        resave: false,
        saveUninitialized: false,
    })
);

app.use("/api", apiRouter);

const validBooking = {
    scheduleId: 1,
    ticketClass: "standard",
    selectedDay: "monday",
    passengers: [
        {
            firstName: "John",
            lastName: "Smith",
            email: "john@example.com",
            phone: "9876543210",
        },
    ],
};

// Create an admin account and log in through the real login endpoint.
async function createAdminAgent() {
    const role = await Role.create({
        name: "admin",
    });

    const passwordHash = await bcrypt.hash("AdminPass123!", 12);

    await User.create({
        displayName: "Test Admin",
        username: "testadmin",
        email: "testadmin@example.com",
        passwordHash,
        role: role._id,
    });

    const agent = request.agent(app);

    await agent
        .post("/api/auth/login")
        .send({
            username: "testadmin",
            password: "AdminPass123!",
        })
        .expect(200);

    return agent;
}

describe("Bookings API", () => {
    test("GET /api/bookings returns all bookings", async () => {
        const agent = await createAdminAgent();

        const response = await agent
            .get("/api/bookings")
            .expect(200);

        expect(response.body).toHaveProperty("count", 0);
        expect(response.body.bookings).toEqual([]);
    });

    test("POST /api/bookings creates a booking", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send(validBooking)
            .expect(201);

        expect(response.body.message).toBe(
            "Booking created successfully."
        );

        expect(response.body.booking).toMatchObject({
            scheduleId: 1,
            tripId: "alpine-panorama",
            ticketClass: "standard",
            selectedDay: "monday",
            status: "confirmed",
        });

        expect(response.body.booking.id).toBeTruthy();

        expect(response.body.booking.passengers).toHaveLength(1);
        expect(response.body.booking.passengers[0].email).toBe(
            "john@example.com"
        );

        const db = getDb();
        const trip = await db.collection("trips").findOne({
            id: "alpine-panorama",
        });
        const ticket = await db.collection("ticketClasses").findOne({
            class: "standard",
        });

        const expectedPrice = trip.distance * ticket.pricePerKm;

        expect(response.body.booking.unitPrice).toBe(expectedPrice);
        expect(response.body.booking.totalAmount).toBe(expectedPrice);
    });

    test("POST /api/bookings rejects invalid passenger information", async () => {
        const invalidBooking = {
            ...validBooking,
            passengers: [
                {
                    firstName: "",
                    lastName: "Smith",
                    email: "invalid-email",
                    phone: "9876543210",
                },
            ],
        };

        const response = await request(app)
            .post("/api/bookings")
            .send(invalidBooking)
            .expect(400);

        expect(response.body.message).toBe(
            "Invalid booking or passenger information."
        );
    });

    test("POST /api/bookings rejects unavailable schedules", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send({
                ...validBooking,
                scheduleId: 4,
            })
            .expect(400);

        expect(response.body.message).toBe(
            "Schedule not found or unavailable."
        );
    });

    test("GET /api/bookings/:bookingId returns a booking", async () => {
        const created = await request(app)
            .post("/api/bookings")
            .send(validBooking)
            .expect(201);

        const bookingId = created.body.booking.id;

        const response = await request(app)
            .get(`/api/bookings/${bookingId}`)
            .expect(200);

        expect(response.body.booking.id).toBe(bookingId);
        expect(response.body.booking.ticketClass).toBe("standard");
    });

    test("GET /api/bookings/:bookingId returns 404 for an unknown booking", async () => {
        const response = await request(app)
            .get("/api/bookings/nonexistent-booking")
            .expect(404);

        expect(response.body.message).toBe("Booking not found.");
    });

    test("PUT /api/bookings/:bookingId updates booking status only", async () => {
        const created = await request(app)
            .post("/api/bookings")
            .send(validBooking)
            .expect(201);

        const bookingId = created.body.booking.id;
        const agent = await createAdminAgent();

        const response = await agent
            .put(`/api/bookings/${bookingId}`)
            .send({
                status: "cancelled",
            })
            .expect(200);

        expect(response.body.booking.status).toBe("cancelled");
        expect(response.body.booking.ticketClass).toBe("standard");
        expect(response.body.booking.passengers).toHaveLength(1);
    });

    test("PUT /api/bookings/:bookingId updates ticket class and recalculates fare", async () => {
        const created = await request(app)
            .post("/api/bookings")
            .send(validBooking)
            .expect(201);

        const bookingId = created.body.booking.id;
        const agent = await createAdminAgent();

        const response = await agent
            .put(`/api/bookings/${bookingId}`)
            .send({
                ticketClass: "premium",
            })
            .expect(200);

        const db = getDb();
        const trip = await db.collection("trips").findOne({
            id: "alpine-panorama",
        });
        const ticket = await db.collection("ticketClasses").findOne({
            class: "premium",
        });

        const expectedPrice = trip.distance * ticket.pricePerKm;

        expect(response.body.booking.ticketClass).toBe("premium");
        expect(response.body.booking.unitPrice).toBe(expectedPrice);
        expect(response.body.booking.totalAmount).toBe(expectedPrice);
    });

    test("PUT /api/bookings/:bookingId rejects invalid status", async () => {
        const created = await request(app)
            .post("/api/bookings")
            .send(validBooking)
            .expect(201);

        const agent = await createAdminAgent();

        const response = await agent
            .put(`/api/bookings/${created.body.booking.id}`)
            .send({
                status: "pending",
            })
            .expect(400);

        expect(response.body.message).toBe("Invalid booking status.");
    });

    test("DELETE /api/bookings/:bookingId deletes a booking", async () => {
        const created = await request(app)
            .post("/api/bookings")
            .send(validBooking)
            .expect(201);

        const bookingId = created.body.booking.id;
        const agent = await createAdminAgent();

        const response = await agent
            .delete(`/api/bookings/${bookingId}`)
            .expect(200);

        expect(response.body.message).toBe(
            "Booking deleted successfully."
        );

        await request(app)
            .get(`/api/bookings/${bookingId}`)
            .expect(404);
    });

    test("DELETE /api/bookings/:bookingId returns 404 for an unknown booking", async () => {
        const agent = await createAdminAgent();

        const response = await agent
            .delete("/api/bookings/nonexistent-booking")
            .expect(404);

        expect(response.body.message).toBe("Booking not found.");
    });
});
