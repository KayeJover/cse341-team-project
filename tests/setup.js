import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';

const connectionString = inject('MONGODB_TEST_URI');

process.env.MONGODB_URI = connectionString;
process.env.MONGODB_DB_NAME = 'kizuna-rail-test-sessions';
process.env.SESSION_SECRET = 'booking-integration-test-secret';

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName: 'kizuna-rail-test'
  });
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await closeDb();
});
