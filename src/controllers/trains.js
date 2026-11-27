
import {
  getTrainById as findTrainById,
  getAllTrains as findAllTrains,
} from "../models/trains.js";

export async function getTrainById(req, res) {
  try {
    const { id } = req.params;

    const train = await findTrainById(id);

    if (!train) {
      return res.status(404).json({
        error: "Train not found",
      });
    }

    return res.status(200).json(train);
  } catch (error) {
    console.error("Error fetching train:", error);

    return res.status(500).json({
      error: "Failed to fetch train",
    });
  }
}

export async function getAllTrains(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = req.query.search ?? "";

    // Validate search parameter
    if (
      typeof search !== "string" ||
      search.length > 100
    ) {
      return res.status(400).json({
        error: "Search must be a string of up to 100 characters.",
      });
    }

    const trimmedSearch = search.trim();

    // Validate pagination parameters
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 10
    ) {
      return res.status(400).json({
        error:
          "Page and limit must be positive integers. Limit cannot exceed 10.",
      });
    }

    const { trains, totalItems } = await findAllTrains(
      page,
      limit,
      trimmedSearch
    );

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      trains,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        search: trimmedSearch,
      },
    });
  } catch (error) {
    console.error("Error fetching trains:", error);

    return res.status(500).json({
      error: "Failed to fetch trains",
    });
  }
}
