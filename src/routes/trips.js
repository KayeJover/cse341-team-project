import { bookingPage, processBookingRequest } from './book.js';
import confirmationPage from './confirm.js';
import listTripsPage from './list.js';
import tripDetailsPage from './details.js';
import { Router } from 'express';
import { getAllTrips, getTripById } from '../models/trips.js';

const router = Router();

// Get all trips API
export const tripsApi = async (req, res, next) => {
    try {

        const trips = await getAllTrips();
        return res.json({ trips });
    } catch (error) {
        return next(error);
    }

};

// Get one trip API
export const tripApi = async (req, res, next) => {
    try {
        const trip = await getTripById(req.params.tripId);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        return res.json({ trip });
    } catch (error) {
        return next(error);
    }
};

// List all trips
router.get('/', listTripsPage);

// Trip details page
router.get('/:tripId', tripDetailsPage);

// Book ticket
router.get('/booking/:scheduleId', bookingPage);
router.post('/book', processBookingRequest);

// Booking confirmation page
router.get('/confirmation/:confirmationId', confirmationPage);

export default router;
