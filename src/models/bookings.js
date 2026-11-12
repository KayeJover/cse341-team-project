import Booking from "./schemas/bookings.js";

export async function createBooking(bookingData) {
    const booking = await Booking.create(bookingData)
    return booking
    
}

export async function getAllBookings() {
    const booking = await Booking.find().lean()
    return booking
    
}

export async function getBookingById(id) {
    const booking = await Booking.findById(id).lean()
    return booking
    
}


