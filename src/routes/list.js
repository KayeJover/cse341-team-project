
import {
    getAllTrips,
    getTripFilters,
} from "../models/trips.js";

export default async (req, res) => {
    try {
        const [trips, { regions, seasons }] = await Promise.all([
            getAllTrips(),
            getTripFilters(),
        ]);

        res.render("trips/list", {
            title: "Scenic Train Trips",
            regions,
            trips,
            seasons,
        });
    } catch (error) {
        console.error("Error retrieving trips:", error);
        res.status(500).render("errors/500", {
            title: "Server Error",
        });
    }
};
