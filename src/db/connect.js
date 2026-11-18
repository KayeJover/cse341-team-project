
import dns from 'node:dns';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

dns.setServers(['8.8.8.8', '1.1.1.1']);

let database;
let client;

const connectToDb = async (options = {}) => {
    if (database) {
        return database;
    }

    const connectionString =
        options.connectionString || process.env.MONGODB_URI;

    const databaseName =
        options.databaseName || process.env.MONGODB_DB_NAME || 'practice';

    if (!connectionString) {
        throw new Error('MONGODB_URI is required.');
    }

    const mongoClient = new MongoClient(connectionString);

    await mongoClient.connect();

    try {
        await mongoose.connect(connectionString, {
            dbName: databaseName,
        });

        client = mongoClient;
        database = client.db(databaseName);

        return database;
    } catch (error) {
        await mongoClient.close();
        throw error;
    }
};

const getDb = () => {
    if (!database) {
        throw new Error(
            'Database not initialized. Call connectToDb first.'
        );
    }

    return database;
};

const closeDb = async () => {
    if (client) {
        await client.close();
        client = undefined;
        database = undefined;
    }

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
};

export { closeDb, connectToDb, getDb };
