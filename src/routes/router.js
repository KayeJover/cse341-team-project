import { Router } from "express";
import apiRouter from "./api-routes.js";
import ejsRouter from "./ejs-routes.js";
import adminRouter from "./admin-routes.js";

const router = Router();

// API routes
router.use("/api", apiRouter);

// Admin dashboard routes
router.use("/", adminRouter);

// EJS page routes
router.use("/", ejsRouter);

export default router;