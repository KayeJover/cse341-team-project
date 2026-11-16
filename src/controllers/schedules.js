import { getSchedulesByTripId } from "../models/schedules.js";

export async function getSchedulesForTrip(
  req,
  res
) {
  try {
    const { tripId } = req.params;

    const schedules =
      await getSchedulesByTripId(tripId);

    return res.status(200).json({
      schedules,
    });
  } catch (error) {
    console.error(
      "Error fetching schedules:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch schedules",
    });
  }
}