
import {
    registerUser,
    authenticateUser,
} from "../models/auth.js";

// Register a new user.
export async function register(req, res) {
    try {
        const { displayName, username, email, password } = req.body;

        if (!displayName || !username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required.",
            });
        }

        const user = await registerUser({
            displayName,
            username,
            email,
            password,
        });

        return res.status(201).json({
            message: "Registration successful.",
            user,
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.message === "Username or email is already registered.") {
            return res.status(409).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Registration failed.",
        });
    }
}

// Log in an existing user.
export async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required.",
            });
        }

        const user = await authenticateUser(username, password);

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password.",
            });
        }

        // Regenerate the session ID after successful authentication.
        await new Promise((resolve, reject) => {
            req.session.regenerate((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        req.session.user = user;

        // Save the session before sending the response.
        await new Promise((resolve, reject) => {
            req.session.save((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        return res.status(200).json({
            message: "Login successful.",
            user,
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed.",
        });
    }
}

// Log out the current user.
export async function logout(req, res) {
    try {
        await new Promise((resolve, reject) => {
            req.session.destroy((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Clear the session cookie.
        res.clearCookie("kizuna.sid", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.status(200).json({
            message: "Logout successful.",
        });
    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            message: "Logout failed.",
        });
    }
}
