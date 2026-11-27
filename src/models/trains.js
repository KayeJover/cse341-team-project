
import train from "./schemas/trains.js";

export async function getTrainById(id) {
  return train.findOne({ id }).lean();
}

export async function getAllTrains(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit;

  const filter = search
    ? {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { operator: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ],
    }
    : {};

  const [trains, totalItems] = await Promise.all([
    train.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    train.countDocuments(filter),
  ]);

  return { trains, totalItems };
}
