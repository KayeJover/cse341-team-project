
import {
  getAllStations as findAllStations,
  getStationById as findStationById,
} from "../models/stations.js";

// GET /api/stations
export async function getAllStations(req, res) {
  try {
    const filters = {};

    if (req.query.region) {
      filters.region = req.query.region;
    }

    const stations = await findAllStations(filters);

    return res.status(200).json({ stations });
  } catch (error) {
    console.error("Error fetching stations:", error);

    return res.status(500).json({
      error: "Failed to fetch stations",
    });
  }
}

// GET /api/stations/:stationId
export async function getStationById(req, res) {
  try {
    const { stationId } = req.params;

    const station = await findStationById(stationId);

    if (!station) {
      return res.status(404).json({
        error: "Station not found",
      });
    }

    return res.status(200).json({ station });
  } catch (error) {
    console.error("Error fetching station:", error);

    return res.status(500).json({
      error: "Failed to fetch station",
    });
  }
}
