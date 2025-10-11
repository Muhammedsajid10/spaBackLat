// Simple script to dump the `attendances` collection to a JSON file.
// Usage (PowerShell):
// $env:MONGO_URI = "mongodb+srv://..."
// node scripts/dumpAttendance.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI environment variable is required.');
    process.exit(1);
  }

  const outFile = path.resolve(__dirname, '..', 'attendance_dump.json');
  console.log('Connecting to Mongo...');

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(); // uses DB from connection string
    const collectionName = process.env.ATTENDANCE_COLLECTION || 'attendances';
    const col = db.collection(collectionName);

    console.log(`Counting documents in ${collectionName}...`);
    const total = await col.countDocuments();
    console.log(`Found ${total} documents. Dumping to ${outFile}`);

    const cursor = col.find().sort({ date: 1 });

    const stream = fs.createWriteStream(outFile, { encoding: 'utf8' });
    stream.write('[\n');

    let first = true;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      // Remove MongoDB specific types that don't JSON.stringify well (ObjectId -> toString)
      if (doc._id && typeof doc._id.toString === 'function') {
        doc._id = doc._id.toString();
      }
      const line = JSON.stringify(doc, (k, v) => v === undefined ? null : v);
      if (!first) stream.write(',\n');
      stream.write(line);
      first = false;
    }

    stream.write('\n]\n');
    stream.end();

    console.log('Dump complete.');
  } catch (err) {
    console.error('Error while dumping attendance:', err.message || err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
}

main();
