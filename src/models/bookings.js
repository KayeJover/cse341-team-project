// src/models/bookings.js
import Booking from "./schemas/bookings.js";

export async function getAllBookings() {
    return Booking.find({}).sort({ createdAt: -1 }).lean();
}

export async function getBookingById(id) {
    return Booking.findOne({ id }).lean();
}

export async function createBooking(bookingData) {
    const booking = new Booking(bookingData);
    return booking.save();
}

export async function updateBooking(id, updates) {
    return Booking.findOneAndUpdate(
        { id },
        { $set: updates },
        {
           returnDocument: "after", runValidators: true
        }
    ).lean();
}

export async function deleteBooking(id) {
    return Booking.findOneAndDelete({ id }).lean();
}
