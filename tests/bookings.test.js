
import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";

import app from "../app.js";
import initializeRoles from "../src/db/seed-roles.js";
import { getDb } from "../src/db/connect.js";

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

const signIn = async (username, email, role = "customer") => {
    const agent = request.agent(app);
    const password = "Rail-test-password42";
    await agent.post("/api/auth/register")
        .send({ displayName: username, username, email, password })
        .expect(201);

    if (role === "admin") {
        const db = getDb();
        const adminRole = await db.collection("roles").findOne({ name: "admin" });
        await db.collection("users").updateOne(
            { username },
            { $set: { role: adminRole._id } }
        );
    }

    await agent.post("/api/auth/login").send({ username, password }).expect(200);
    return agent;
};

describe("Bookings API", () => {
    beforeEach(async () => {
        await initializeRoles();
    });

    test("GET /api/bookings returns all bookings", async () => {
        const admin = await signIn("railadmin", "admin@example.com", "admin");

        const response = await admin
            .get("/api/bookings")
            .expect(200);

        expect(response.body).toHaveProperty("bookings");
    });

    test("GET /api/bookings rejects unauthenticated users", async () => {
        const response = await request(app)
            .get("/api/bookings")
            .expect(401);

        expect(response.body.message).toBe(
            "Authentication required. Please log in."
        );
    });
    test("GET /api/bookings returns only bookings belonging to the authenticated customer", async () => {
        const username = `booking_test_${Date.now()}`;
        const email = `${username}@example.com`;
        const password = "BookingTest123!";

        await request(app)
            .post("/api/auth/register")
            .send({
                displayName: "Booking Test User",
                username,
                email,
                password,
            })
            .expect(201);

        // Create a booking containing this customer's email.
        await request(app)
            .post("/api/bookings")
            .send({
                ...validBooking,
                passengers: [
                    {
                        ...validBooking.passengers[0],
                        email,
                    },
                ],
            })
            .expect(201);

        // Create another booking belonging to a different customer.
        await request(app)
            .post("/api/bookings")
            .send(validBooking)
            .expect(201);

        const agent = request.agent(app);

        await agent
            .post("/api/auth/login")
            .send({ username, password })
            .expect(200);

        const response = await agent
            .get("/api/bookings")
            .expect(200);

        expect(response.body.count).toBe(1);
        expect(response.body.bookings).toHaveLength(1);

        expect(
            response.body.bookings[0].passengers.some(
                (passenger) => passenger.email === email
            )
        ).toBe(true);
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

        const admin = await signIn("railadmin", "admin@example.com", "admin");
        const response = await admin
            .get(`/api/bookings/${bookingId}`)
            .expect(200);

        expect(response.body.booking.id).toBe(bookingId);
        expect(response.body.booking.ticketClass).toBe("standard");
    });

    test("GET /api/bookings/:bookingId returns 404 for an unknown booking", async () => {
        const admin = await signIn("railadmin", "admin@example.com", "admin");
        const response = await admin
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

        const admin = await signIn("railadmin", "admin@example.com", "admin");
        const response = await admin
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

        const admin = await signIn("railadmin", "admin@example.com", "admin");
        const response = await admin
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

        const admin = await signIn("railadmin", "admin@example.com", "admin");
        const response = await admin
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

        const admin = await signIn("railadmin", "admin@example.com", "admin");
        const response = await admin
            .delete(`/api/bookings/${bookingId}`)
            .expect(200);

        expect(response.body.message).toBe(
            "Booking deleted successfully."
        );

        await admin.get(`/api/bookings/${bookingId}`).expect(404);
    });

    test("DELETE /api/bookings/:bookingId returns 404 for an unknown booking", async () => {
        const admin = await signIn("railadmin", "admin@example.com", "admin");
        const response = await admin
            .delete("/api/bookings/nonexistent-booking")
            .expect(404);

        expect(response.body.message).toBe("Booking not found.");
    });
    test("requires authentication for the booking admin page and API operations", async () => {
        const guest = request(app);
        await guest.get("/bookings-admin").expect(302).expect("Location", "/login");
        await guest.get("/bookings").expect(302).expect("Location", "/login");
        await guest.get("/api/bookings").expect(401);
        await guest.get("/api/bookings/unknown").expect(401);
        await guest.put("/api/bookings/unknown").send({ status: "cancelled" }).expect(401);
        await guest.delete("/api/bookings/unknown").expect(401);
    });

    test("customers can manage only bookings matching a passenger email", async () => {
        const customer = await signIn("john", "john@example.com");
        const admin = await signIn("railadmin", "admin@example.com", "admin");
        const own = await request(app).post("/api/bookings").send(validBooking).expect(201);
        const other = await request(app).post("/api/bookings").send({
            ...validBooking,
            passengers: [{ ...validBooking.passengers[0], email: "other@example.com" }],
        }).expect(201);
        const ownId = own.body.booking.id;
        const otherId = other.body.booking.id;

        const list = await customer.get("/api/bookings").expect(200);
        expect(list.body.count).toBe(1);
        expect(list.body.bookings.map(({ id }) => id)).toEqual([ownId]);

        const adminList = await admin.get("/api/bookings").expect(200);
        expect(adminList.body.count).toBe(2);
        await admin.get("/admin").expect(200).expect(/href="\/bookings-admin"/);
        await customer.get("/bookings-admin").expect(200);

        await customer.get(`/api/bookings/${otherId}`).expect(403);
        await customer.put(`/api/bookings/${otherId}`).send({ status: "cancelled" }).expect(403);
        await customer.delete(`/api/bookings/${otherId}`).expect(403);

        await admin.put(`/api/bookings/${otherId}`).send({ status: "cancelled" }).expect(200);
        await admin.delete(`/api/bookings/${otherId}`).expect(200);

        await customer.get(`/api/bookings/${ownId}`).expect(200);
        await customer.put(`/api/bookings/${ownId}`).send({ status: "cancelled" }).expect(200);
        await customer.delete(`/api/bookings/${ownId}`).expect(200);
        await customer.get(`/api/bookings/${ownId}`).expect(404);
    });

});
