
import { getSchedulesByTripId } from "../models/schedules.js";

export async function getSchedulesForTrip(req, res) {
    try {
        const { tripId } = req.params;

        const schedules = await getSchedulesByTripId(tripId);

        if (schedules === null) {
            return res.status(404).json({
                message: "Trip not found",
            });
        }

        return res.status(200).json({
            count: schedules.length,
            schedules,
        });
    } catch (error) {
        console.error("Error fetching schedules:", error);

        return res.status(500).json({
            message: "Failed to fetch schedules",
        });
    }
}

export async function getSchedulesForTripAndMonth(req, res) {
    try {
        const { tripId } = req.params;
        const month = Number(req.query.month);

        if (
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12
        ) {
            return res.status(400).json({
                message: "Invalid month. Use a number between 1 and 12.",
            });
        }

        const schedules = await getSchedulesByTripId(
            tripId,
            month
        );

        if (schedules === null) {
            return res.status(404).json({
                message: "Trip not found",
            });
        }

        return res.status(200).json({
            count: schedules.length,
            schedules,
        });
    } catch (error) {
        console.error("Error fetching monthly schedules:", error);

        return res.status(500).json({
            message: "Failed to fetch schedules",
        });
    }
}
