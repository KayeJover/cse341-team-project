import mongoose from 'mongoose';

const weekdays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];

const ticketClassSchema = new mongoose.Schema(
    {
        class: {
            type: String,
            required: true,
            unique: true,
            enum: ['standard', 'premium', 'first']
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        pricePerKm: {
            type: Number,
            required: true,
            min: 0
        },
        amenities: {
            type: [String],
            default: []
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        availableDays: {
            type: [
                {
                    type: String,
                    enum: weekdays
                }
            ],
            default: []
        }
    },
    {
        collection: 'ticketClasses'
    }
);

export default mongoose.model('TicketClass', ticketClassSchema);