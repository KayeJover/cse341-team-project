
import Station from "./schemas/stations.js";

export async function getStationById(id) {
  return Station.findOne({ id }).lean();
}

export async function getAllStations(filters = {}) {
  return Station.find(filters).lean();
}
