
import {
    getTripById as findTripById,
    getAllTrips as findAllTrips,
    updateTripById,
    deleteTripById,
} from "../models/trips.js";

import { getStationById } from "../models/stations.js";
import { countBookings } from "../models/bookings.js";
import { countSchedulesByTripId } from "../models/schedules.js";

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
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        const { keyword = "", region = "all", season = "all" } = req.query;

        // Validate pagination parameters
        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                message: "Invalid pagination parameters. Page must be a positive integer and limit must be between 1 and 100."
            });
        }

        // Validate search parameters
        if (
            typeof keyword !== "string" ||
            typeof region !== "string" ||
            typeof season !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid search or filter parameters."
            });
        }

        const result = await findAllTrips(page, limit, {
            keyword: keyword.trim(),
            region,
            season
        });

        return res.status(200).json(result);

    } catch (error) {
        console.error("Error fetching trips:", error);

        return res.status(500).json({
            message: "Failed to fetch trips"
        });
    }
}

/**
 * EJS controller: Render the trips list page.
 * Trip data and filter options are loaded by client-side JavaScript.
 */
export function renderTripListPage(req, res) {
    return res.render("trips/list", {
        title: "Scenic Train Trips",
    });
}

/**
 * EJS controller: Render an individual trip details page.
 * The trip itself is loaded here; schedules are loaded separately by the API.
 */
export async function renderTripDetailsPage(req, res) {
    try {
        const { tripId } = req.params;

        const details = await findTripById(tripId);

        if (!details) {
            return res.status(404).render("errors/404", {
                title: "Trip Not Found",
            });
        }

        return res.render("trips/details", {
            title: "Trip Details",
            details,
        });
    } catch (error) {
        console.error("Error retrieving trip details:", error);

        return res.status(500).render("errors/500", {
            title: "Server Error",
        });
    }
}

/**
 * Render the protected Trip Admin page.
 */
export function renderTripAdminPage(req, res) {
    return res.render("trips/admin", {
        title: "Trip Administration",
        user: req.user,
    });
}


/**
 * Update an existing trip.
 * Only administrators can access this operation.
 */
export async function updateTripHandler(req, res) {
    try {
        const { tripId } = req.params;

        const allowedFields = [
            "name",
            "description",
            "region",
            "startStation",
            "endStation",
            "duration",
            "distance",
            "highlights",
            "bestSeason",
            "operatingMonths",
            "imageUrl",
        ];

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                message: "Invalid request body.",
            });
        }

        const updates = {};

        for (const field of Object.keys(req.body)) {
            if (!allowedFields.includes(field)) {
                return res.status(400).json({
                    message: `Invalid update field: ${field}`,
                });
            }

            updates[field] = req.body[field];
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid update fields provided.",
            });
        }

        const existingTrip = await findTripById(tripId);

        if (!existingTrip) {
            return res.status(404).json({
                message: "Trip not found.",
            });
        }

        const stringFields = [
            "name",
            "description",
            "region",
            "startStation",
            "endStation",
            "duration",
            "bestSeason",
            "imageUrl",
        ];

        for (const field of stringFields) {
            if (Object.hasOwn(updates, field)) {
                if (
                    typeof updates[field] !== "string" ||
                    (field !== "imageUrl" && !updates[field].trim())
                ) {
                    return res.status(400).json({
                        message: `Invalid value for ${field}.`,
                    });
                }

                updates[field] = updates[field].trim();
            }
        }

        if (
            Object.hasOwn(updates, "distance") &&
            (
                typeof updates.distance !== "number" ||
                !Number.isFinite(updates.distance) ||
                updates.distance < 0
            )
        ) {
            return res.status(400).json({
                message: "Distance must be a non-negative number.",
            });
        }

        if (
            Object.hasOwn(updates, "highlights") &&
            (
                !Array.isArray(updates.highlights) ||
                updates.highlights.length === 0 ||
                updates.highlights.some(
                    (item) =>
                        typeof item !== "string" || !item.trim()
                )
            )
        ) {
            return res.status(400).json({
                message: "Highlights must contain valid text values.",
            });
        }

        if (
            Object.hasOwn(updates, "operatingMonths") &&
            (
                !Array.isArray(updates.operatingMonths) ||
                updates.operatingMonths.length === 0 ||
                updates.operatingMonths.some(
                    (month) =>
                        !Number.isInteger(month) ||
                        month < 1 ||
                        month > 12
                )
            )
        ) {
            return res.status(400).json({
                message: "Operating months must be integers from 1 to 12.",
            });
        }

        const startStation =
            updates.startStation ?? existingTrip.startStation;

        const endStation =
            updates.endStation ?? existingTrip.endStation;

        const [start, end] = await Promise.all([
            getStationById(startStation),
            getStationById(endStation),
        ]);

        if (!start || !end) {
            return res.status(400).json({
                message: "Invalid start or end station.",
            });
        }

        const trip = await updateTripById(tripId, updates);

        if (!trip) {
            return res.status(404).json({
                message: "Trip not found.",
            });
        }

        return res.status(200).json({
            message: "Trip updated successfully.",
            trip,
        });
    } catch (error) {
        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                message: "Invalid trip information.",
            });
        }

        console.error("Error updating trip:", error);

        return res.status(500).json({
            message: "Failed to update trip.",
        });
    }
}


/**
 * Delete an existing trip.
 * Prevent deletion when dependent records exist.
 */
export async function deleteTripHandler(req, res) {
    try {
        const { tripId } = req.params;

        const existingTrip = await findTripById(tripId);

        if (!existingTrip) {
            return res.status(404).json({
                message: "Trip not found.",
            });
        }

        const [bookingCount, scheduleCount] = await Promise.all([
            countBookings({ tripId }),
            countSchedulesByTripId(tripId),
        ]);

        if (bookingCount > 0 || scheduleCount > 0) {
            return res.status(409).json({
                message:
                    "Cannot delete a trip with existing bookings or schedules.",
            });
        }

        const trip = await deleteTripById(tripId);

        if (!trip) {
            return res.status(404).json({
                message: "Trip not found.",
            });
        }

        return res.status(200).json({
            message: "Trip deleted successfully.",
        });
    } catch (error) {
        console.error("Error deleting trip:", error);

        return res.status(500).json({
            message: "Failed to delete trip.",
        });
    }
}
