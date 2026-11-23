import { Router } from "express";
import {
    requirePageLogin,
    requirePageRole,
} from "../middleware/auth.js";

const router = Router();

// Admin dashboard - accessible only to logged-in administrators.
router.get(
    "/admin",
    requirePageLogin(),
    requirePageRole("admin"),
    (req, res) => {
        res.render("admin-dashboard", {
            title: "Admin Dashboard",
            user: req.session.user,
        });
    }
);

export default router;
