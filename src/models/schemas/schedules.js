
import mongoose from "mongoose";

const weekdays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
];

const scheduleSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true,
        },
        tripId: {
            type: String,
            required: true,
            trim: true,
        },
        departureTime: {
            type: String,
            required: true,
            trim: true,
        },
        arrivalTime: {
            type: String,
            required: true,
            trim: true,
        },
        daysOfWeek: {
            type: [
                {
                    type: String,
                    enum: weekdays,
                },
            ],
            required: true,
        },
        status: {
            type: Boolean,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

scheduleSchema.index({ tripId: 1 });

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
