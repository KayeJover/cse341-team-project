


// Load the logged-in user from the session.
export function loadSessionUser(req, res, next) {
    const user = req.session?.user || null;

    req.user = user;
    res.locals.user = user;

    return next();
}

// Require a logged-in user for API routes.
export function requireApiLogin() {
    return (req, res, next) => {
        if (!req.session?.user) {
            return res.status(401).json({
                message: "Authentication required. Please log in.",
            });
        }

        req.user = req.session.user;
        return next();
    };
}

// Require a logged-in user for web pages.
export function requirePageLogin() {
    return (req, res, next) => {
        if (!req.session?.user) {
            return res.redirect("/login");
        }

        req.user = req.session.user;
        return next();
    };
}

// Require a specific role for API routes.
export function requireApiRole(role) {
    return (req, res, next) => {
        if (!req.session?.user) {
            return res.status(401).json({
                message: "Authentication required. Please log in.",
            });
        }

        req.user = req.session.user;

        if (req.user.role !== role) {
            return res.status(403).json({
                message: "Access denied. You do not have the required role.",
            });
        }

        return next();
    };
}

// Require a specific role for web pages.
export function requirePageRole(role) {
    return (req, res, next) => {
        if (!req.session?.user) {
            return res.redirect("/login");
        }

        req.user = req.session.user;

        if (req.user.role !== role) {
            return res.status(403).render("errors/403", {
                title: "Access Denied",
                error: "You do not have permission to access this page.",
            });
        }

        return next();
    };
}

// Keep the existing middleware compatible with current routes.
export function requireAuth(req, res, next) {
    return requireApiLogin()(req, res, next);
}

export function requireAdmin(req, res, next) {
    return requireApiRole("admin")(req, res, next);
}
