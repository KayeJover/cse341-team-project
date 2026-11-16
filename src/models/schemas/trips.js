
import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        region: {
            type: String,
            required: true,
            trim: true,
        },
        startStation: {
            type: String,
            required: true,
            trim: true,
        },
        endStation: {
            type: String,
            required: true,
            trim: true,
        },
        duration: {
            type: String,
            required: true,
            trim: true,
        },
        distance: {
            type: Number,
            required: true,
            min: 0,
        },
        highlights: {
            type: [String],
            required: true,
        },
        // added enum in best season by Sam Levi
        bestSeason: {
            type: String,
            required: true,
            trim: true,
            enum: ["Spring", "Summer", "Autumn", "Winter"],
        },
        // added train, trip could identify the train assigned to operate it.
        // added by Sam Levi
        train: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Train",
            required: true,
        },
        operatingMonths: {
            type: [
                {
                    type: Number,
                    min: 1,
                    max: 12,
                },
            ],
            required: true,
        },
        imageUrl: {
            type: String,
            required: false,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
