// src/models/bookings.js
import Booking from "./schemas/bookings.js";

export async function getAllBookings(filter = {}, options = {}) {
    const { page, limit } = options;

    let query = Booking.find(filter).sort({ createdAt: -1 });

    if (page && limit) {
        query = query.skip((page - 1) * limit).limit(limit);
    }

    return query.lean();
}

export async function countBookings(filter = {}) {
    return Booking.countDocuments(filter);
}

export async function getBookingById(id, filter = {}) {
    return Booking.findOne({ ...filter, id }).lean();
}

export async function createBooking(bookingData) {
    const booking = new Booking(bookingData);
    return booking.save();
}

export async function updateBooking(id, updates, filter) {
    return Booking.findOneAndUpdate(
        { ...filter, id },
        { $set: updates },
        {
            returnDocument: "after",
            runValidators: true,
        }
    ).lean();
}

export async function deleteBooking(id, filter) {
    return Booking.findOneAndDelete({ ...filter, id }).lean();
}