
import { getDb } from "../db/connect.js";
import { generateConfirmationCode } from "../includes/helpers.js";

import {
    getAllBookings as getAllBookingsFromModel,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
} from "../models/bookings.js";

import { getAllTicketClasses } from "../models/ticket-classes.js";


// Validate passenger information
const validatePassengers = (passengers) => {
    if (
        !Array.isArray(passengers) ||
        passengers.length < 1 ||
        passengers.length > 8
    ) {
        return false;
    }

    return passengers.every((passenger) =>
        passenger &&
        typeof passenger.firstName === "string" &&
        passenger.firstName.trim() &&
        typeof passenger.lastName === "string" &&
        passenger.lastName.trim() &&
        typeof passenger.email === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email.trim()) &&
        typeof passenger.phone === "string" &&
        passenger.phone.trim()
    );
};

// Retrieve booking information and calculate the correct fare
const getBookingDetails = async (scheduleId, ticketClass, selectedDay) => {
    const db = getDb();

    const schedule = await db.collection("schedules").findOne({
        id: Number(scheduleId),
    });

    if (!schedule || !schedule.status) {
        return { error: "Schedule not found or unavailable." };
    }

    if (!schedule.daysOfWeek.includes(selectedDay)) {
        return { error: "Selected day is not available for this schedule." };
    }

    const trip = await db.collection("trips").findOne({
        id: schedule.tripId,
    });

    if (!trip) {
        return { error: "Trip not found." };
    }

    const ticket = await db.collection("ticketClasses").findOne({
        class: ticketClass,
    });

    if (!ticket) {
        return { error: "Invalid ticket class." };
    }

    const unitPrice = trip.distance * ticket.pricePerKm;

    return {
        scheduleId: Number(scheduleId),
        tripId: schedule.tripId,
        ticketClass,
        selectedDay,
        unitPrice,
    };
};

// GET /api/bookings
export const getAllBookings = async (req, res, next) => {
    try {
        const bookings = await getAllBookingsFromModel();

        return res.status(200).json({
            count: bookings.length,
            bookings,
        });
    } catch (error) {
        return next(error);
    }
};

// GET /api/bookings/:bookingId
export const getBookingHandler = async (req, res, next) => {
    try {
        const booking = await getBookingById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        return res.status(200).json({ booking });
    } catch (error) {
        return next(error);
    }
};

// POST /api/bookings
export const createBookingHandler = async (req, res, next) => {
    try {
        const {
            scheduleId,
            ticketClass,
            selectedDay,
            passengers,
        } = req.body;

        const numericScheduleId = Number(scheduleId);

        if (
            !Number.isInteger(numericScheduleId) ||
            numericScheduleId < 1
        ) {
            return res.status(400).json({
                message: "A valid scheduleId is required.",
            });
        }

        if (
            typeof ticketClass !== "string" ||
            typeof selectedDay !== "string" ||
            !validatePassengers(passengers)
        ) {
            return res.status(400).json({
                message: "Invalid booking or passenger information.",
            });
        }

        const normalizedDay = selectedDay.toLowerCase();

        const details = await getBookingDetails(
            numericScheduleId,
            ticketClass,
            normalizedDay
        );

        if (details.error) {
            return res.status(400).json({
                message: details.error,
            });
        }

        const bookingData = {
            id: generateConfirmationCode(),
            ...details,
            passengers: passengers.map((passenger) => ({
                firstName: passenger.firstName.trim(),
                lastName: passenger.lastName.trim(),
                email: passenger.email.trim().toLowerCase(),
                phone: passenger.phone.trim(),
            })),
            totalAmount: details.unitPrice * passengers.length,
            status: "confirmed",
        };

        const booking = await createBooking(bookingData);

        return res.status(201).json({
            message: "Booking created successfully.",
            booking,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Booking reference already exists.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        return next(error);
    }
};

// PUT /api/bookings/:bookingId
export const updateBookingHandler = async (req, res, next) => {
    try {
        const existingBooking = await getBookingById(
            req.params.bookingId
        );

        if (!existingBooking) {
            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        const {
            ticketClass,
            selectedDay,
            passengers,
            status,
        } = req.body;

        // Reject an empty update request.
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                message: "At least one field is required for an update.",
            });
        }

        // Validate status when supplied.
        if (
            status !== undefined &&
            !["confirmed", "cancelled"].includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid booking status.",
            });
        }

        // Validate booking details only when supplied.
        if (
            ticketClass !== undefined &&
            typeof ticketClass !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid ticket class.",
            });
        }

        if (
            selectedDay !== undefined &&
            typeof selectedDay !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid selected day.",
            });
        }

        if (
            passengers !== undefined &&
            !validatePassengers(passengers)
        ) {
            return res.status(400).json({
                message: "Invalid passenger information.",
            });
        }

        const updates = {};

        // Update status independently.
        if (status !== undefined) {
            updates.status = status;
        }

        // Recalculate booking details only when necessary.
        const bookingDetailsChanged =
            ticketClass !== undefined ||
            selectedDay !== undefined ||
            passengers !== undefined;

        if (bookingDetailsChanged) {
            const normalizedDay = (
                selectedDay ?? existingBooking.selectedDay
            ).toLowerCase();

            const updatedTicketClass =
                ticketClass ?? existingBooking.ticketClass;

            const updatedPassengers =
                passengers ?? existingBooking.passengers;

            const details = await getBookingDetails(
                existingBooking.scheduleId,
                updatedTicketClass,
                normalizedDay
            );

            if (details.error) {
                return res.status(400).json({
                    message: details.error,
                });
            }

            updates.ticketClass = updatedTicketClass;
            updates.selectedDay = normalizedDay;

            updates.passengers = updatedPassengers.map((passenger) => ({
                firstName: passenger.firstName.trim(),
                lastName: passenger.lastName.trim(),
                email: passenger.email.trim().toLowerCase(),
                phone: passenger.phone.trim(),
            }));

            updates.unitPrice = details.unitPrice;
            updates.totalAmount =
                details.unitPrice * updatedPassengers.length;
        }

        const booking = await updateBooking(
            req.params.bookingId,
            updates
        );

        return res.status(200).json({
            message: "Booking updated successfully.",
            booking,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        return next(error);
    }
};

// DELETE /api/bookings/:bookingId
export const deleteBookingHandler = async (req, res, next) => {
    try {
        const booking = await deleteBooking(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        return res.status(200).json({
            message: "Booking deleted successfully.",
            booking,
        });
    } catch (error) {
        return next(error);
    }
};


// GET /trips/booking/:scheduleId
export const bookingPage = async (req, res, next) => {
    try {
        const scheduleId = Number(req.params.scheduleId);
        const db = getDb();

        const schedule = await db.collection("schedules").findOne({
            id: scheduleId,
        });

        if (!schedule || !schedule.status) {
            return res.status(404).render("404", {
                title: "Schedule Not Found",
            });
        }

        const trip = await db.collection("trips").findOne({
            id: schedule.tripId,
        });

        if (!trip) {
            return res.status(404).render("404", {
                title: "Trip Not Found",
            });
        }

       const ticketClasses = await getAllTicketClasses();

        const ticketOptions = ticketClasses.map((ticketClass) => ({
            class: ticketClass.class,
            name: ticketClass.name,
            price: trip.distance * ticketClass.pricePerKm,
            amenities: ticketClass.amenities,
            description: ticketClass.description,
        }));

        return res.render("trips/book", {
            title: "Book Trip",
            schedule,
            ticketOptions,
        });
    } catch (error) {
        return next(error);
    }
};

// POST /trips/book
export const processBookingRequest = async (req, res, next) => {
    try {
        const {
            scheduleId,
            ticketClass,
            selectedDay,
            passengers,
        } = req.body;

        const numericScheduleId = Number(scheduleId);

        if (
            !Number.isInteger(numericScheduleId) ||
            numericScheduleId < 1 ||
            typeof ticketClass !== "string" ||
            typeof selectedDay !== "string" ||
            !validatePassengers(passengers)
        ) {
            return res.status(400).send("Invalid booking information.");
        }

        const normalizedDay = selectedDay.toLowerCase();

        const details = await getBookingDetails(
            numericScheduleId,
            ticketClass,
            normalizedDay
        );

        if (details.error) {
            return res.status(400).send(details.error);
        }

        const bookingData = {
            id: generateConfirmationCode(),
            ...details,
            passengers: passengers.map((passenger) => ({
                firstName: passenger.firstName.trim(),
                lastName: passenger.lastName.trim(),
                email: passenger.email.trim().toLowerCase(),
                phone: passenger.phone.trim(),
            })),
            totalAmount: details.unitPrice * passengers.length,
            status: "confirmed",
        };

        const booking = await createBooking(bookingData);

        return res.redirect(
            `/trips/confirmation/${booking.id}`
        );
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).send(
                "Booking reference already exists."
            );
        }

        if (error.name === "ValidationError") {
            return res.status(400).send(error.message);
        }

        return next(error);
    }
};

// GET /trips/confirmation/:confirmationId
export const confirmationPage = async (req, res, next) => {
    try {
        const booking = await getBookingById(
            req.params.confirmationId
        );

        if (!booking) {
            return res.status(404).render("404", {
                title: "Booking Not Found",
            });
        }

        return res.render("trips/confirm", {
            title: "Trip Confirmation",
            confirmation: booking,
        });
    } catch (error) {
        return next(error);
    }
};


// GET /bookings-admin
export const bookingsPage = (req, res) => {
    return res.render("bookings", {
        title: "Bookings",
    });
};
