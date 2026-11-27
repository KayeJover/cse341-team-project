
import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";

import app from "../app.js";
import initializeRoles from "../src/db/seed-roles.js";
import { getDb } from "../src/db/connect.js";

const signIn = async () => {
    const agent = request.agent(app);
    const username = "bookingfilteradmin";
    const password = "Rail-test-password42";

    await agent.post("/api/auth/register")
        .send({
            displayName: "Booking Filter Admin",
            username,
            email: "bookingfilteradmin@example.com",
            password,
        })
        .expect(201);

    const db = getDb();
    const adminRole = await db.collection("roles").findOne({
        name: "admin",
    });

    await db.collection("users").updateOne(
        { username },
        { $set: { role: adminRole._id } }
    );

    await agent.post("/api/auth/login")
        .send({ username, password })
        .expect(200);

    return agent;
};

const createBooking = async (id, ticketClass, createdAt) => {
    const db = getDb();

    await db.collection("bookings").insertOne({
        id,
        scheduleId: 1,
        tripId: "alpine-panorama",
        ticketClass,
        selectedDay: "monday",
        specialRequests: "",
        passengers: [
            {
                firstName: "John",
                lastName: "Smith",
                email: "john@example.com",
                phone: "9876543210",
            },
        ],
        unitPrice: 100,
        totalAmount: 100,
        status: "confirmed",
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
    });
};

describe("Booking API filters", () => {
    beforeEach(async () => {
        await initializeRoles();

        await createBooking(
            "filter-standard-1",
            "standard",
            "2026-01-10T10:00:00.000Z"
        );

        await createBooking(
            "filter-premium-1",
            "premium",
            "2026-01-15T10:00:00.000Z"
        );

        await createBooking(
            "filter-first-1",
            "first",
            "2026-01-20T10:00:00.000Z"
        );

        await createBooking(
            "filter-standard-2",
            "standard",
            "2026-01-25T10:00:00.000Z"
        );
    });

    test("filters bookings by ticket class", async () => {
        const admin = await signIn();

        const response = await admin
            .get("/api/bookings?ticketClass=premium")
            .expect(200);

        expect(response.body.count).toBe(1);
        expect(response.body.bookings).toHaveLength(1);
        expect(response.body.bookings[0].ticketClass).toBe("premium");
    });

    test("filters bookings by start date", async () => {
        const admin = await signIn();

        const response = await admin
            .get("/api/bookings?startDate=2026-01-20")
            .expect(200);

        expect(response.body.count).toBe(2);

        expect(
            response.body.bookings.every(
                (booking) => booking.createdAt >= "2026-01-20"
            )
        ).toBe(true);
    });

    test("filters bookings by end date, including the entire end date", async () => {
        const admin = await signIn();

        const response = await admin
            .get("/api/bookings?endDate=2026-01-15")
            .expect(200);

        expect(response.body.count).toBe(2);

        expect(
            response.body.bookings.some(
                (booking) => booking.id === "filter-premium-1"
            )
        ).toBe(true);
    });

    test("combines ticket class and date filters", async () => {
        const admin = await signIn();

        const response = await admin
            .get(
                "/api/bookings?ticketClass=standard&startDate=2026-01-20"
            )
            .expect(200);

        expect(response.body.count).toBe(1);
        expect(response.body.bookings).toHaveLength(1);
        expect(response.body.bookings[0].id).toBe("filter-standard-2");
    });

    test("rejects an invalid ticket class", async () => {
        const admin = await signIn();

        const response = await admin
            .get("/api/bookings?ticketClass=business")
            .expect(400);

        expect(response.body.message).toBe(
            "Invalid ticket class filter."
        );
    });

    test("rejects an invalid start date", async () => {
        const admin = await signIn();

        const response = await admin
            .get("/api/bookings?startDate=2026-02-30")
            .expect(400);

        expect(response.body.message).toBe(
            "Dates must be valid and use YYYY-MM-DD format."
        );
    });

    test("rejects an invalid end date format", async () => {
        const admin = await signIn();

        const response = await admin
            .get("/api/bookings?endDate=15-01-2026")
            .expect(400);

        expect(response.body.message).toBe(
            "Dates must be valid and use YYYY-MM-DD format."
        );
    });

    test("rejects a start date later than the end date", async () => {
        const admin = await signIn();

        const response = await admin
            .get(
                "/api/bookings?startDate=2026-01-20&endDate=2026-01-10"
            )
            .expect(400);

        expect(response.body.message).toBe(
            "Start date cannot be after end date."
        );
    });

    test("pagination metadata reflects filtered booking results", async () => {
        const admin = await signIn();

        const response = await admin
            .get("/api/bookings?ticketClass=standard&page=1")
            .expect(200);

        expect(response.body.count).toBe(2);
        expect(response.body.pagination.totalBookings).toBe(2);
        expect(response.body.pagination.currentPage).toBe(1);
        expect(response.body.pagination.totalPages).toBe(1);
        expect(response.body.pagination.hasNextPage).toBe(false);
    });
});
