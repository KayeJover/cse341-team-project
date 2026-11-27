
// src/routes/api-routes.js

import { Router } from "express";

import {
    register,
    login,
    logout,
} from "../controllers/auth.js";

import { requireApiLogin, requireAuth } from "../middleware/auth.js";

import {
    getAllTrips,
    getTripById,
} from "../controllers/trips.js";

import {
    getSchedulesForTrip,
    getSchedulesForTripAndMonth,
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
    getAllTicketClasses,
    getTicketClassesForDay
} from "../controllers/ticket-classes.js";

import {
    getAllBookings,
    getBookingHandler,
    createBookingHandler,
    updateBookingHandler,
    deleteBookingHandler,
} from "../controllers/bookings.js";

import usersRouter from "./users-routes.js";

const router = Router();
router.use("/users", usersRouter);

// ==========================================
// AUTHENTICATION API
// ==========================================

// Register
router.post("/auth/register", register);

// Login
router.post("/auth/login", login);

// Logout
router.post("/auth/logout", logout);

// Get currently authenticated user
router.get("/auth/me", requireAuth, (req, res) => {
    return res.status(200).json({
        user: req.session.user,
    });
});

// ==========================================
// TRIPS API
// ==========================================

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

// Trips routes
router.get("/trips", getAllTrips);
router.get("/trips/:tripId", getTripById);

// ==========================================
// STATIONS API
// ==========================================

router.get("/stations", getAllStations);
router.get("/stations/:stationId", getStationById);

// ==========================================
// TRAINS API
// ==========================================


/**
 * @swagger
 * /trains:
 *   get:
 *     summary: Get all trains with pagination and keyword search
 *     description: Retrieves trains with pagination. Optionally searches train names, operators, and types.
 *     tags: [Trains]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 10
 *         description: Number of trains per page
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search trains by name, operator, or type (case-insensitive)
 *         example: express
 *     responses:
 *       200:
 *         description: Paginated list of trains matching the search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trains:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     search:
 *                       type: string
 *       400:
 *         description: Invalid pagination or search parameters
 *       500:
 *         description: Failed to fetch trains
 */


router.get("/trains", getAllTrains);
router.get("/trains/:id", getTrainById);

// ==========================================
// BOOKINGS API
// ==========================================


/**
 * @swagger
 * /trips/{tripId}/schedules:
 *   get:
 *     summary: Get schedules for a trip
 *     description: Retrieves active schedules for a trip, optionally filtered by operating month.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         description: Unique ID of the trip
 *         schema:
 *           type: string
 *         example: alpine-panorama
 *       - in: query
 *         name: month
 *         required: false
 *         description: Operating month number (1 through 12)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         example: 4
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 schedules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Invalid month parameter
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6af43023042585ddcb195056"
 *         id:
 *           type: integer
 *           example: 1
 *         tripId:
 *           type: string
 *           example: alpine-panorama
 *         departureTime:
 *           type: string
 *           example: "08:30"
 *         arrivalTime:
 *           type: string
 *           example: "13:00"
 *         daysOfWeek:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: boolean
 *           example: true
 *
 *     ApiError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Trip not found
 */



router.get(
    "/trips/:tripId/schedules",
    (req, res) => {
        if (req.query.month !== undefined) {
            return getSchedulesForTripAndMonth(req, res);
        }

        return getSchedulesForTrip(req, res);
    }
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
 *     summary: Get paginated bookings visible to the signed-in user
 *     description: Administrators see all bookings. Other users see bookings listing their email as a passenger. Results are sorted by booking date, newest first, with 10 bookings per page.
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number to retrieve. Defaults to 1.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Paginated bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalBookings:
 *                       type: integer
 *                       example: 25
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Invalid page number. Page must be a positive integer.
 *       401:
 *         description: Sign-in required
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
 *       401:
 *         description: Sign-in required
 *       403:
 *         description: Booking is outside the signed-in user’s access
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
 *       401:
 *         description: Sign-in required
 *       403:
 *         description: Booking is outside the signed-in user’s access
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
 *       401:
 *         description: Sign-in required
 *       403:
 *         description: Booking is outside the signed-in user’s access
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */

// Bookings routes



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

// Bookings API
router.get("/bookings", requireApiLogin(), getAllBookings);
router.get("/bookings/:bookingId", requireApiLogin(), getBookingHandler);
// Public booking creation supports guest checkout.
router.post("/bookings", createBookingHandler);
router.put("/bookings/:bookingId", requireApiLogin(), updateBookingHandler);
router.delete("/bookings/:bookingId", requireApiLogin(), deleteBookingHandler);

// ==========================================
// EXPORT ROUTER
// ==========================================

export default router;
