
import { Router } from "express";
import {
    getAllTrips,
    getTripById,
} from "../controllers/trips.js";

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



// Get all trips
router.get("/trips", getAllTrips);

// Get a single trip
router.get("/trips/:tripId", getTripById);



// Booking endpoints
import { getAllBookings } from "../controllers/bookings.js";
import { getAllTrains } from "../controllers/trains.js";

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all Bookings
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: List of all Bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Failed to fetch trips
 */
router.get("/bookings", getAllBookings);


// Trains endpoints

router.get("/trains", getAllTrains)
export default router;
