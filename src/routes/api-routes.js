
import { Router } from "express";
import {
    getAllTrips,
    getTripById,
} from "../controllers/trips.js";
import {
    getAllStations,
    getStationById,
} from "../controllers/stations.js";
import {
    getAllTrains,
    getTrainById,
} from "../controllers/trains.js";
import {
    getAllTicketClasses,
    getTicketClassesForDay
} from "../controllers/ticket-classes.js";

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
// Stations API
router.get("/stations", getAllStations);
router.get("/stations/:stationId", getStationById);
// Trains API
router.get("/trains", getAllTrains);
router.get("/trains/:id", getTrainById);

/**
 * @swagger
 * /ticket-classes:
 *   get:
 *     summary: Get all ticket classes or filter by weekday
 *     tags: [Ticket Classes]
 *     parameters:
 *       - in: query
 *         name: day
 *         required: false
 *         description: Optional lowercase weekday name
 *         schema:
 *           type: string
 *           enum:
 *             - monday
 *             - tuesday
 *             - wednesday
 *             - thursday
 *             - friday
 *             - saturday
 *             - sunday
 *         example: monday
 *     responses:
 *       200:
 *         description: Matching ticket classes, or an empty array
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketClasses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       class:
 *                         type: string
 *                         enum: [standard, premium, first]
 *                       name:
 *                         type: string
 *                       pricePerKm:
 *                         type: number
 *                         minimum: 0
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       description:
 *                         type: string
 *                       availableDays:
 *                         type: array
 *                         items:
 *                           type: string
 *                           enum:
 *                             - monday
 *                             - tuesday
 *                             - wednesday
 *                             - thursday
 *                             - friday
 *                             - saturday
 *                             - sunday
 *       400:
 *         description: Empty or invalid weekday parameter
 *         content:
 *           application/json:
 *             example:
 *               message: Invalid day. Use a lowercase weekday name.
 *       500:
 *         description: Unable to retrieve ticket classes
 *         content:
 *           application/json:
 *             example:
 *               message: Unable to retrieve ticket classes.
 */
router.get("/ticket-classes", (req, res) => {
    if (req.query.day !== undefined) {
        return getTicketClassesForDay(req, res);
    }

    return getAllTicketClasses(req, res);
});

export default router;
