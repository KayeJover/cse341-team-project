import User from "./schemas/users.js";
import Role from "./schemas/roles.js";

export async function listUsers({ page, limit }) {
    const totalItems = await User.countDocuments();
    if (page > Math.ceil(totalItems / limit)) {
        return { users: [], totalItems };
    }

    const records = await User.find()
        .select("displayName username email role")
        .sort({ username: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "role", model: Role, select: "name" })
        .lean();

    const users = records.map(({ _id, displayName, username, email, role }) => ({
        id: _id,
        displayName,
        username,
        email,
        role: role?.name ?? null,
    }));

    return { users, totalItems };
}
