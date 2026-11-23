import {
    getAllTicketClasses as findAllTicketClasses,
    getTicketClassesForDay as findTicketClassesForDay
} from '../models/ticket-classes.js';

const weekdays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];

const getAllTicketClasses = async (req, res) => {
    try {
        const ticketClasses = await findAllTicketClasses();

        return res.status(200).json({ ticketClasses });
    } catch (error) {
        console.error('Failed to retrieve ticket classes:', error);

        return res.status(500).json({
            message: 'Unable to retrieve ticket classes.'
        });
    }
};

const getTicketClassesForDay = async (req, res) => {
    const { day } = req.query;

    if (typeof day !== 'string' || !weekdays.includes(day)) {
        return res.status(400).json({
            message: 'Invalid day. Use a lowercase weekday name.'
        });
    }

    try {
        const ticketClasses = await findTicketClassesForDay(day);

        return res.status(200).json({ ticketClasses });
    } catch (error) {
        console.error('Failed to retrieve ticket classes for day:', error);

        return res.status(500).json({
            message: 'Unable to retrieve ticket classes.'
        });
    }
};

export {
    getAllTicketClasses,
    getTicketClassesForDay
};