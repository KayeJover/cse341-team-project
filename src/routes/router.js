
import { Router } from "express";
import apiRouter from "./api-routes.js";
import ejsRouter from "./ejs-routes.js";

const router = Router();

// API routes
router.use("/api", apiRouter);

// EJS page routes
router.use("/", ejsRouter);

export default router;
