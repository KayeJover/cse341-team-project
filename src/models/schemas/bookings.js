// src/models/schemas/bookings.js
import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 25,
        },
    },
    { _id: false }
);

const bookingSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        scheduleId: {
            type: Number,
            required: true,
            min: 1,
        },
        tripId: {
            type: String,
            required: true,
            trim: true,
        },
        ticketClass: {
            type: String,
            required: true,
            enum: ["standard", "premium", "first"],
        },
        selectedDay: {
            type: String,
            required: true,
            lowercase: true,
            enum: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ],
        },
        passengers: {
            type: [passengerSchema],
            required: true,
            validate: {
                validator: (passengers) =>
                    passengers.length >= 1 && passengers.length <= 8,
                message: "A booking must have between 1 and 8 passengers.",
            },
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["confirmed", "cancelled"],
            default: "confirmed",
        },
    },
    {
        timestamps: true,
        collection: "bookings",
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
