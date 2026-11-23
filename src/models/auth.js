
import bcrypt from "bcrypt";
import User from "./schemas/users.js";
import Role from "./schemas/roles.js";

export async function registerUser({ displayName, username, email, password }) {
    const existingUser = await User.findOne({
        $or: [
            { username: username.toLowerCase() },
            { email: email.toLowerCase() },
        ],
    });

    if (existingUser) {
        throw new Error("Username or email is already registered.");
    }

    const customerRole = await Role.findOne({ name: "customer" });

    if (!customerRole) {
        throw new Error("Customer role not found.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
        displayName,
        username,
        email,
        passwordHash,
        role: customerRole._id,
    });

    return {
        id: user._id,
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        role: "customer",
    };
}

export async function authenticateUser(username, password) {
    const user = await User.findOne({
        username: username.toLowerCase(),
    }).populate("role");

    if (!user) {
        return null;
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!passwordMatches) {
        return null;
    }

    return {
        id: user._id,
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        role: user.role.name,
    };
}
