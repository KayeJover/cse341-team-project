
import { Router } from "express";

import {
    bookingPage,
    processBookingRequest,
    confirmationPage,
} from "../controllers/bookings.js";

const router = Router();

// Book ticket page
router.get("/booking/:scheduleId", bookingPage);

// Process booking
router.post("/book", processBookingRequest);

// Booking confirmation page
router.get("/confirmation/:confirmationId", confirmationPage);

export default router;
