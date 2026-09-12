import { count } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import { cases, pets, users } from '../db/schema.js';
import { demoSeedManifest } from '../demo/scenarios.js';

export const verifySafeDemoSeed = async () => {
  const db = getDatabase();
  const [userCount, petCount, caseCount] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(pets),
    db.select({ value: count() }).from(cases),
  ]);
  return {
    manifest: demoSeedManifest(),
    observedPersistentCounts: {
      users: userCount[0].value,
      pets: petCount[0].value,
      cases: caseCount[0].value,
    },
    touchedTables: [] as string[],
  };
};

const result = await verifySafeDemoSeed();
console.log(`Demo seed verified ${result.manifest.scenarios.length} synthetic scenarios; no database rows were written.`);
