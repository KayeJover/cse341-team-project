import { Router } from "express";
import { getUsers } from "../controllers/users.js";
import { requireApiRole } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     userAdminSession:
 *       type: apiKey
 *       in: cookie
 *       name: kizuna.sid
 * /users:
 *   get:
 *     summary: List users in username order (admin only)
 *     tags: [Users]
 *     security:
 *       - userAdminSession: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 10, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated users. A page with no results has an empty users array.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       displayName: { type: string }
 *                       username: { type: string }
 *                       email: { type: string }
 *                       role: { type: string, nullable: true }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage: { type: integer }
 *                     itemsPerPage: { type: integer }
 *                     totalItems: { type: integer }
 *                     totalPages: { type: integer }
 *       400:
 *         description: Invalid pagination parameters
 *       401:
 *         description: Sign-in required
 *       403:
 *         description: Administrator role required
 *       500:
 *         description: Failed to load users
 */
router.get("/", requireApiRole("admin"), getUsers);

export default router;
