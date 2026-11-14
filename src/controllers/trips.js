
import {
    getTripById as findTripById,
    getAllTrips as findAllTrips,
} from "../models/trips.js";

export async function getTripById(req, res) {
    try {
        const { tripId } = req.params;

        const trip = await findTripById(tripId);

        if (!trip) {
            return res.status(404).json({
                message: "Trip not found",
            });
        }

        return res.status(200).json({ trip });
    } catch (error) {
        console.error("Error fetching trip:", error);

        return res.status(500).json({
            message: "Failed to fetch trip",
        });
    }
}

export async function getAllTrips(req, res) {
    try {
        const trips = await findAllTrips();

        return res.status(200).json({ trips });
    } catch (error) {
        console.error("Error fetching trips:", error);

        return res.status(500).json({
            message: "Failed to fetch trips",
        });
    }
}
