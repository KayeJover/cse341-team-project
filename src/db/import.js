
import { closeDb, connectToDb } from './connect.js';
import { initializeDatabase } from './initialize.js';
import initializeRoles from './seed-roles.js';

try {
  const db = await connectToDb();

  await initializeDatabase(db);
  await initializeRoles();

  console.log('MongoDB import complete.');
} finally {
  await closeDb();
}
