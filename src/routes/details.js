
import { getTripById } from "../models/trips.js";
import { getDb } from "../db/connect.js";

export default async (req, res) => {
    try {
        const { tripId } = req.params;
        const details = await getTripById(tripId);

        if (!details) {
            return res.status(404).render("errors/404", {
                title: "Trip Not Found",
            });
        }

        const db = getDb();

        details.schedules = await db
            .collection("schedules")
            .find({ tripId })
            .toArray();

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
};
