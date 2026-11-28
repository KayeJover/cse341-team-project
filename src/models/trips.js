
import Trip from "./schemas/trips.js";

export async function getTripById(id) {
    return Trip.findOne({ id }).lean();
}


export async function getAllTrips(
    page = 1,
    limit = 3,
    filters = {}
) {
    const { keyword, region, season } = filters;

    const query = {};

    // Filter by region
    if (region && region !== "all") {
        query.region = region;
    }

    // Filter by season
    if (season && season !== "all") {
        query.bestSeason = season;
    }

    // Search trip name and description
    if (keyword) {
        query.$or = [
            { name: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [trips, total, filterOptions] = await Promise.all([
        Trip.find(query)
            .skip(skip)
            .limit(limit)
            .lean(),
        Trip.countDocuments(query),
        getTripFilters()
    ]);

    return {
        data: trips,
        pagination: {
            currentPage: page,
            limit,
            totalRecords: total,
            totalPages: Math.ceil(total / limit)
        },
        filters: filterOptions
    };
}

export async function getTripFilters() {
    const [regions, seasons] = await Promise.all([
        Trip.distinct("region"),
        Trip.distinct("bestSeason"),
    ]);

    return { regions, seasons };
}


/**
 * Update an existing trip using its custom trip ID.
 */
export async function updateTripById(id, updates) {
    return Trip.findOneAndUpdate(
        { id },
        { $set: updates },
        {
            returnDocument: "after",
            runValidators: true,
        }
    ).lean();
}

/**
 * Delete an existing trip using its custom trip ID.
 */
export async function deleteTripById(id) {
    return Trip.findOneAndDelete({ id }).lean();
}
