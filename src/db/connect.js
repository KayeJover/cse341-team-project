
import dns from 'node:dns';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

// Use public DNS servers for MongoDB Atlas SRV lookups.
dns.setServers(['8.8.8.8', '1.1.1.1']);

let database;
let client;

const connectToDb = async (options = {}) => {
  if (database) {
    return database;
  }

  const connectionString = options.connectionString || process.env.MONGODB_URI;
  const databaseName = options.databaseName || process.env.MONGODB_DB_NAME || 'practice';

  if (!connectionString) {
    throw new Error('MONGODB_URI is required.');
  }

  // Connect using the native MongoDB driver.
  client = new MongoClient(connectionString);
  await client.connect();

  database = client.db(databaseName);

  // Connect Mongoose to the same database.
  await mongoose.connect(connectionString, {
    dbName: databaseName,
  });
  // Connect Mongoose for models and schemas.
  await mongoose.connect(connectionString, {
    dbName: databaseName,
  });

  // Keep the native MongoDB connection for existing features.
  // Connect using the native MongoDB driver.
  client = new MongoClient(connectionString);
  await client.connect();

  database = client.db(databaseName);

  // Connect Mongoose to the same database.
  await mongoose.connect(connectionString, {
    dbName: databaseName,
  });
  return database;
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDb first.');
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