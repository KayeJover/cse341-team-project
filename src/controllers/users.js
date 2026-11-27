import { listUsers } from "../models/users.js";

function positiveInteger(value, defaultValue) {
    if (value === undefined) return defaultValue;
    if (typeof value !== "string" || !/^\d+$/.test(value)) return NaN;

    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : NaN;
}

export async function getUsers(req, res) {
    const page = positiveInteger(req.query.page, 1);
    const limit = positiveInteger(req.query.limit, 10);

    if (!page || !limit || limit > 10) {
        return res.status(400).json({
            message: "Page and limit must be positive integers, and limit cannot exceed 10.",
        });
    }

    const { role, search = "" } = req.query;
    if (role !== undefined && role !== "admin" && role !== "customer") {
        return res.status(400).json({ message: "Role must be admin or customer." });
    }
    if (typeof search !== "string" || search.length > 100) {
        return res.status(400).json({ message: "Search must be text of up to 100 characters." });
    }

    const keyword = search.trim();
    try {
        const { users, totalItems } = await listUsers({ page, limit, role, search: keyword });
        return res.json({
            users,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems,
                role: role ?? null,
                search: keyword,
                totalPages: Math.ceil(totalItems / limit),
            },
        });
    } catch (error) {
        console.error("Failed to load users:", error);
        return res.status(500).json({ message: "Failed to load users." });
    }
}
