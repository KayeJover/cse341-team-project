
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

/**
 * Count all schedules associated with a trip.
 */
export async function countSchedulesByTripId(tripId) {
    return Schedule.countDocuments({ tripId });
}

/**
 * Retrieve all schedules, including inactive schedules.
 */
export async function getAllSchedules() {
    return Schedule.find()
        .sort({ departureTime: 1 })
        .lean();
}

/**
 * Retrieve all schedules assigned to a specific trip.
 */
export async function getAdminSchedulesByTripId(tripId) {
    return Schedule.find({ tripId })
        .sort({ departureTime: 1 })
        .lean();
}

/**
 * Reassign an existing schedule to another trip.
 */
export async function reassignSchedule(
    scheduleId,
    currentTripId,
    newTripId
) {
    return Schedule.findOneAndUpdate(
        {
            id: scheduleId,
            tripId: currentTripId,
        },
        {
            $set: {
                tripId: newTripId,
            },
        },
        {
            returnDocument: "after",
            runValidators: true,
        }
    ).lean();
}
