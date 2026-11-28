import User from "./schemas/users.js";
import Role from "./schemas/roles.js";

export async function listUsers({ page, limit, role, search }) {
    const filter = {};
    if (role) {
        const matchedRole = await Role.findOne({ name: role }).select("_id").lean();
        if (!matchedRole) return { users: [], totalItems: 0 };
        filter.role = matchedRole._id;
    }
    if (search) {
        const keyword = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [
            { displayName: keyword },
            { username: keyword },
            { email: keyword },
        ];
    }

    const totalItems = await User.countDocuments(filter);
    if (page > Math.ceil(totalItems / limit)) {
        return { users: [], totalItems };
    }

    const records = await User.find(filter)
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
