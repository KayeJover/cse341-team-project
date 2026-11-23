
import Schedule from "./schemas/schedules.js";
import Trip from "./schemas/trips.js";

export async function getScheduleById(id) {
    return Schedule.findOne({ id: Number(id) }).lean();
}

export async function getSchedulesByTripId(tripId, month = null) {
    const trip = await Trip.findOne({ id: tripId }).lean();

    if (!trip) {
        return null;
    }

    if (month !== null) {
        const operatingMonths = trip.operatingMonths || [];

        if (!operatingMonths.includes(month)) {
            return [];
        }
    }

    return Schedule.find({
        tripId,
        status: true,
    })
        .sort({ departureTime: 1 })
        .lean();
}
