
import { Router } from "express";
import { homePage, aboutPage, testErrorPage } from "./index.js";
import { trainsPage } from "./trains.js";
import railTripsRouter from "./trips.js";
import stationsRouter from "./stations.js";

const router = Router();

// Home page
router.get("/", homePage);

// About page
router.get("/about", aboutPage);

// Trains page
router.get("/trains", trainsPage);

// Trips pages
router.use("/trips", railTripsRouter);

// Test 500 error page
router.get("/500", testErrorPage);

// Stations page
router.get("/stations", (req, res) => {
    res.render("stations", { title: "Stations" });
});

// Individual station details page
router.get("/stations/:stationId", (req, res) => {
    res.render("station-details", {
        title: "Station Details",
        stationId: req.params.stationId,
    });
});
export default router;
