
import Role from "../models/schemas/roles.js";

const initializeRoles = async () => {
    const defaultRoles = ["customer", "admin"];

    for (const name of defaultRoles) {
        await Role.updateOne(
            { name },
            { $setOnInsert: { name } },
            { upsert: true }
        );
    }

    console.log("Default roles initialized.");
};

export default initializeRoles;
