import stations from './seeds/stations.json' with { type: 'json' };
import { closeDb, connectToDb } from './connect.js';

try {
  const db = await connectToDb();
  const collection = db.collection('stations');

  for (const station of stations) {
    await collection.updateOne(
      { id: station.id },
      { $set: station },
      { upsert: true }
    );
  }

  console.log(`Imported ${stations.length} stations successfully.`);
} finally {
  await closeDb();
}