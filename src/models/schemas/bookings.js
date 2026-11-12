import mongoose from "mongoose";
import validator from "validator"

const bookingSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    scheduledId: {
        type: String,
        required: true,

    },
    tripId: {
        type: String,
        required: true,

    },
    ticketClass: {
        type: String,
        required: true
    },
    selectedDay: {
        type: String,
        required: true,
        enum: [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
        ],
    },
    passengers: [
        {
            firstname: {
                type: String,
                required: true,
                trim: true,
            },
            lastname: {
                type: String,
                required: true,
                trim: true,
            },
            email: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                validator: validator.isEmail,
                message: "Please enter a valid email address"
            },
            phone: {
                type: String,
                required: true,
                trim: true,
            },
        }
    ]

})

const Booking = mongoose.model("Booking", bookingSchema)

export default Booking