// src/controllers/bookings.js
import { getScheduleById } from "../models/schedules.js";
import { getTripById } from "../models/trips.js";
import {
    getAllTicketClasses,
    getTicketClassByClass,
} from "../models/ticket-classes.js";
import { generateConfirmationCode } from "../includes/helpers.js";

import {
    getAllBookings as getAllBookingsFromModel,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
} from "../models/bookings.js";

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


const getBookingDetails = async (scheduleId, ticketClass, selectedDay) => {
    // Retrieve schedule using the Schedule model
    const schedule = await getScheduleById(scheduleId);

    if (!schedule || !schedule.status) {
        return { error: "Schedule not found or unavailable." };
    }

    if (!schedule.daysOfWeek.includes(selectedDay)) {
        return {
            error: "Selected day is not available for this schedule.",
        };
    }

    // Retrieve trip using the Trip model
    const trip = await getTripById(schedule.tripId);

    if (!trip) {
        return { error: "Trip not found." };
    }

    // Retrieve ticket class using the TicketClass model
    const ticket = await getTicketClassByClass(ticketClass);

    if (!ticket) {
        return { error: "Invalid ticket class." };
    }

    if (
        !Array.isArray(ticket.availableDays) ||
        !ticket.availableDays.includes(selectedDay)
    ) {
        return {
            error: "Selected ticket class is not available on this day.",
        };
    }

    // Calculate fare
    const unitPrice = trip.distance * ticket.pricePerKm;

    return {
        scheduleId: Number(scheduleId),
        tripId: schedule.tripId,
        ticketClass,
        selectedDay,
        unitPrice,
    };
};


// Apply the same passenger rule to reads and to the database write itself.
const bookingAccessFilter = (user) => {
    if (user.role === "admin") {
        return {};
    }

    const email = typeof user.email === "string" ? user.email.trim() : "";
    if (!email) {
        return { _id: { $exists: false } };
    }

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return { "passengers.email": new RegExp(`^${escapedEmail}$`, "i") };
};

const respondToMissingAccessibleBooking = async (res, id) => {
    if (await getBookingById(id)) {
        return res.status(403).json({ message: "You cannot access this booking." });
    }

    return res.status(404).json({ message: "Booking not found." });
};

// GET /api/bookings
export const getAllBookings = async (req, res, next) => {
    try {
        const bookings = await getAllBookingsFromModel(bookingAccessFilter(req.user));

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
        const { bookingId } = req.params;
        const booking = await getBookingById(bookingId, bookingAccessFilter(req.user));

        if (!booking) {
            return await respondToMissingAccessibleBooking(res, bookingId);
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
        const { bookingId } = req.params;
        const filter = bookingAccessFilter(req.user);
        const existingBooking = await getBookingById(bookingId, filter);

        if (!existingBooking) {
            return await respondToMissingAccessibleBooking(res, bookingId);
        }

        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({ message: "A booking update object is required." });
        }

        const {
            ticketClass,
            selectedDay,
            passengers,
            status,
        } = req.body;

        // Reject empty update requests.
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                message: "At least one field is required for an update.",
            });
        }

        // Allow only supported update fields.
        const allowedFields = [
            "ticketClass",
            "selectedDay",
            "passengers",
            "status",
        ];

        const invalidFields = Object.keys(req.body).filter(
            (field) => !allowedFields.includes(field)
        );

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: `Unsupported update fields: ${invalidFields.join(", ")}`,
            });
        }

        // Normalize string inputs.
        const normalizedTicketClass =
            typeof ticketClass === "string"
                ? ticketClass.trim().toLowerCase()
                : ticketClass;

        const normalizedDay =
            typeof selectedDay === "string"
                ? selectedDay.trim().toLowerCase()
                : selectedDay;

        // Validate status.
        if (
            status !== undefined &&
            !["confirmed", "cancelled"].includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid booking status.",
            });
        }

        // Validate ticket class.
        if (
            ticketClass !== undefined &&
            (typeof ticketClass !== "string" ||
                !normalizedTicketClass)
        ) {
            return res.status(400).json({
                message: "Invalid ticket class.",
            });
        }

        // Validate selected day.
        if (
            selectedDay !== undefined &&
            (typeof selectedDay !== "string" || !normalizedDay)
        ) {
            return res.status(400).json({
                message: "Invalid selected day.",
            });
        }

        // Validate passengers.
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
            const updatedDay =
                normalizedDay ?? existingBooking.selectedDay;

            const updatedTicketClass =
                normalizedTicketClass ?? existingBooking.ticketClass;

            const updatedPassengers =
                passengers ?? existingBooking.passengers;

            const details = await getBookingDetails(
                existingBooking.scheduleId,
                updatedTicketClass,
                updatedDay
            );

            if (details.error) {
                return res.status(400).json({
                    message: details.error,
                });
            }

            updates.ticketClass = updatedTicketClass;
            updates.selectedDay = updatedDay;

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

        const booking = await updateBooking(bookingId, updates, filter);

        if (!booking) {
            return await respondToMissingAccessibleBooking(res, bookingId);
        }

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
        const { bookingId } = req.params;
        const booking = await deleteBooking(bookingId, bookingAccessFilter(req.user));

        if (!booking) {
            return await respondToMissingAccessibleBooking(res, bookingId);
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
        const schedule = await getScheduleById(scheduleId);

        if (!schedule || !schedule.status) {
            return res.status(404).render("404", {
                title: "Schedule Not Found",
            });
        }

        const trip = await getTripById(schedule.tripId);

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
