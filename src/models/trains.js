
import train from "./schemas/trains.js";

export async function getTrainById(id) {
  return train.findOne({ id }).lean();
}

export async function getAllTrains(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [trains, totalItems] = await Promise.all([
    train.find({})
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    train.countDocuments({})
  ]);

  return { trains, totalItems };
}
