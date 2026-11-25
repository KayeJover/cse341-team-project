
import Trip from "./schemas/trips.js";

export async function getTripById(id) {
    return Trip.findOne({ id }).lean();
}

export async function getAllTrips(page = 1, limit = 3) {
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
        Trip.find({})
            .skip(skip)
            .limit(limit)
            .lean(),
        Trip.countDocuments({})
    ]);

    return {
        data: trips,
        pagination: {
            currentPage: page,
            limit,
            totalRecords: total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function getTripFilters() {
    const [regions, seasons] = await Promise.all([
        Trip.distinct("region"),
        Trip.distinct("bestSeason"),
    ]);

    return { regions, seasons };
}