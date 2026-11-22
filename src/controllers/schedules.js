import { getSchedulesByTripId } from "../models/schedules.js";
import { getTripById } from "../models/trips.js";

export async function getSchedulesForTrip(req, res) {
    try {
        const { tripId } = req.params;

        const trip = await getTripById(tripId);

        if (!trip) {
            return res.status(404).json({
                message: "Trip not found",
            });
        }

        const schedules = await getSchedulesByTripId(tripId);

        return res.status(200).json({
            schedules,
        });
    } catch (error) {
        console.error("Error fetching schedules:", error);

        return res.status(500).json({
            message: "Failed to fetch schedules",
        });
    }
}
