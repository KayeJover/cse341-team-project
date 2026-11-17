
// Check whether the user is authenticated.
export function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            message: "Authentication required. Please log in.",
        });
    }

    next();
}

// Check whether the authenticated user is an admin.
export function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            message: "Authentication required. Please log in.",
        });
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admin privileges required.",
        });
    }

    next();
}
