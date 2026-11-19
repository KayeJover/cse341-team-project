import TicketClass from './schemas/ticket-classes.js';

const getAllTicketClasses = async () => {
    return TicketClass.find({}).lean();
};

const getTicketClassesForDay = async (day) => {
    return TicketClass.find({
        availableDays: day
    }).lean();
};

export {
    getAllTicketClasses,
    getTicketClassesForDay
};