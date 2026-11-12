import { getAllBookings as findAllBookings} from "../models/bookings.js"

export async function getAllBookings(req, res) {
    try {


        const booking = await findAllBookings()

        return res.status(200).json(booking)

    } catch(error) {
        console.error("Error fetchingg bookings", error)
        return res.status(500).json({
            message: "Failed to fetch bookings"            
        })
    }
}