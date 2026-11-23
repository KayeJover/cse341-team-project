
import { Router } from "express";

import {
    homePage,
    aboutPage,
    testErrorPage,
} from "./index.js";

import { trainsPage } from "./trains.js";

import {
    renderTripListPage,
    renderTripDetailsPage,
} from "../controllers/trips.js";

import railTripsRouter from "./trips.js";

import { bookingsPage } from "../controllers/bookings.js";

const router = Router();

// Authentication pages
router.get("/register", (req, res) => {
    res.render("register", {
        title: "Create Account",
    });
});

router.get("/login", (req, res) => {
    res.render("login", {
        title: "Login",
    });
});

// Home page
router.get("/", homePage);

// About page
router.get("/about", aboutPage);

// Trains page
router.get("/trains", trainsPage);

// Trips list page
router.get("/trips", renderTripListPage);

// Individual trip details page
router.get("/trips/:tripId", renderTripDetailsPage);

// Booking routes under /trips
router.use("/trips", railTripsRouter);

// Test 500 error page
router.get("/500", testErrorPage);

// Stations page
router.get("/stations", (req, res) => {
    res.render("stations", {
        title: "Stations",
    });
});

// Individual station details page
router.get("/stations/:stationId", (req, res) => {
    res.render("station-details", {
        title: "Station Details",
        stationId: req.params.stationId,
    });
});

// Bookings pages
router.get("/bookings", bookingsPage);
router.get("/bookings-admin", bookingsPage);

export default router;
