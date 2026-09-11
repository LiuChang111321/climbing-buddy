import 'dotenv/config';
import { db } from './db';
import { gyms } from './db/schema';
import { GYMS } from './gyms';

async function main() {
  for (const name of GYMS) {
    await db.insert(gyms).values({ name }).onConflictDoNothing();
  }
  console.log(`Seeded ${GYMS.length} gyms`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
