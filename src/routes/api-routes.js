// src/routes/api-routes.js
import { Router } from "express";

import {
    getAllTrips,
    getTripById,
} from "../controllers/trips.js";

import {
    getSchedulesForTrip,
} from "../controllers/schedules.js";

import {
    getAllStations,
    getStationById,
} from "../controllers/stations.js";

import {
    getAllTrains,
    getTrainById,
} from "../controllers/trains.js";

import {
    getAllBookings,
    getBookingHandler,
    createBookingHandler,
    updateBookingHandler,
    deleteBookingHandler,
} from "../controllers/bookings.js";
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Scenic train trips
 */

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Get all trips
 *     tags: [Trips]
 *     responses:
 *       200:
 *         description: List of all trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *       500:
 *         description: Failed to fetch trips
 */

/**
 * @swagger
 * /trips/{tripId}:
 *   get:
 *     summary: Get a trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique trip ID
 *     responses:
 *       200:
 *         description: Trip found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trip:
 *                   $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Failed to fetch trip
 *
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         region:
 *           type: string
 *         startStation:
 *           type: string
 *         endStation:
 *           type: string
 *         duration:
 *           type: string
 *         distance:
 *           type: number
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *         bestSeason:
 *           type: string
 *         operatingMonths:
 *           type: array
 *           items:
 *             type: integer
 *         imageUrl:
 *           type: string
 */

/**
 * @swagger
 * /trips/{tripId}/schedules:
 *   get:
 *     summary: Get schedules for a trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedules returned successfully
 *       500:
 *         description: Failed to fetch schedules
 */
router.get(
  "/trips/:tripId/schedules",
  getSchedulesForTrip
);

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Manage passenger train bookings
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Passenger:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Smith
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         phone:
 *           type: string
 *           example: "9876543210"
 *
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: BK123456
 *         scheduleId:
 *           type: integer
 *           example: 1
 *         tripId:
 *           type: string
 *           example: TRIP001
 *         ticketClass:
 *           type: string
 *           enum: [standard, premium, first]
 *         selectedDay:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         passengers:
 *           type: array
 *           minItems: 1
 *           maxItems: 8
 *           items:
 *             $ref: '#/components/schemas/Passenger'
 *         unitPrice:
 *           type: number
 *           example: 1200
 *         totalAmount:
 *           type: number
 *           example: 2400
 *         status:
 *           type: string
 *           enum: [confirmed, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     BookingRequest:
 *       type: object
 *       required:
 *         - scheduleId
 *         - ticketClass
 *         - selectedDay
 *         - passengers
 *       properties:
 *         scheduleId:
 *           type: integer
 *           example: 1
 *         ticketClass:
 *           type: string
 *           enum: [standard, premium, first]
 *         selectedDay:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         passengers:
 *           type: array
 *           minItems: 1
 *           maxItems: 8
 *           items:
 *             $ref: '#/components/schemas/Passenger'
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid booking or passenger information
 *       409:
 *         description: Booking reference already exists
 *       500:
 *         description: Server error
 *
 * /bookings/{bookingId}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking found
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketClass:
 *                 type: string
 *                 enum: [standard, premium, first]
 *               selectedDay:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               passengers:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 8
 *                 items:
 *                   $ref: '#/components/schemas/Passenger'
 *               status:
 *                 type: string
 *                 enum: [confirmed, cancelled]
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       400:
 *         description: Invalid update information
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */



// Get all trips
router.get("/trips", getAllTrips);

// Get a single trip
router.get("/trips/:tripId", getTripById);
// Stations API
router.get("/stations", getAllStations);
router.get("/stations/:stationId", getStationById);
// Trains API
router.get("/trains", getAllTrains);
router.get("/trains/:id", getTrainById);

// Bookings API
router.get("/bookings", getAllBookings);
router.get("/bookings/:bookingId", getBookingHandler);
router.post("/bookings", createBookingHandler);
router.put("/bookings/:bookingId", updateBookingHandler);
router.delete("/bookings/:bookingId", deleteBookingHandler);


export default router;
