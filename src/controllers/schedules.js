
import { getSchedulesByTripId,
         getAllSchedules,
         getAdminSchedulesByTripId,
         getScheduleById,
         reassignSchedule,
 } from "../models/schedules.js";

import { getTripById } from "../models/trips.js";
import { countBookings } from "../models/bookings.js";

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

/**
 * Retrieve all schedules assigned to a particular trip.
 * Includes active and inactive schedules.
 */
export async function getAdminTripSchedulesHandler(req, res) {
    try {
        const { tripId } = req.params;

        const trip = await getTripById(tripId);

        if (!trip) {
            return res.status(404).json({
                message: "Trip not found",
            });
        }

        const schedules = await getAdminSchedulesByTripId(tripId);

        return res.status(200).json({
            count: schedules.length,
            schedules,
        });
    } catch (error) {
        console.error("Error fetching trip schedules:", error);

        return res.status(500).json({
            message: "Failed to fetch trip schedules",
        });
    }
}

/**
 * Retrieve all existing schedules for administrators.
 */
export async function getAllSchedulesHandler(req, res) {
    try {
        const schedules = await getAllSchedules();

        return res.status(200).json({
            count: schedules.length,
            schedules,
        });
    } catch (error) {
        console.error("Error fetching admin schedules:", error);

        return res.status(500).json({
            message: "Failed to fetch schedules",
        });
    }
}

/**
 * Assign an existing schedule to a different trip.
 * Restricted to administrators through route middleware.
 */
export async function reassignScheduleHandler(req, res) {
    try {
        const scheduleId = Number(req.params.scheduleId);
        const tripId = req.body?.tripId;

        if (
            !Number.isInteger(scheduleId) ||
            scheduleId < 1
        ) {
            return res.status(400).json({
                message: "Invalid schedule ID.",
            });
        }

        if (
            typeof tripId !== "string" ||
            !tripId.trim()
        ) {
            return res.status(400).json({
                message: "A valid trip ID is required.",
            });
        }

        const targetTripId = tripId.trim();

        const [schedule, trip] = await Promise.all([
            getScheduleById(scheduleId),
            getTripById(targetTripId),
        ]);

        if (!schedule) {
            return res.status(404).json({
                message: "Schedule not found.",
            });
        }

        if (!trip) {
            return res.status(404).json({
                message: "Trip not found.",
            });
        }

        // No update is needed if the schedule already
        // belongs to the selected trip.
        if (schedule.tripId === targetTripId) {
            return res.status(200).json({
                message: "Schedule is already assigned to this trip.",
                schedule,
            });
        }

        // Protect existing passenger bookings.
        const bookingCount = await countBookings({
            scheduleId,
        });

        if (bookingCount > 0) {
            return res.status(409).json({
                message:
                    "Cannot reassign a schedule with existing bookings.",
            });
        }

        const updatedSchedule = await reassignSchedule(
            scheduleId,
            schedule.tripId,
            targetTripId
        );

        if (!updatedSchedule) {
            return res.status(409).json({
                message:
                    "The schedule has changed. Reload and try again.",
            });
        }

        return res.status(200).json({
            message: "Schedule reassigned successfully.",
            schedule: updatedSchedule,
        });
    } catch (error) {
        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                message: "Invalid schedule information.",
            });
        }

        console.error("Error reassigning schedule:", error);

        return res.status(500).json({
            message: "Failed to reassign schedule.",
        });
    }
}
