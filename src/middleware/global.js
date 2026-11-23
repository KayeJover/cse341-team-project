
import { loadSessionUser } from "./auth.js";

/**
 * Load user information and set global template variables.
 */
const setLocalVariables = (req, res, next) => {
    return loadSessionUser(req, res, () => {
        res.locals.NODE_ENV =
            process.env.NODE_ENV?.toLowerCase() || "production";

        res.locals.query = req.query;

        return next();
    });
};

export default setLocalVariables;
