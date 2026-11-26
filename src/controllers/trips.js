
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
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

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

        const result = await findAllTrips(page, limit);

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
