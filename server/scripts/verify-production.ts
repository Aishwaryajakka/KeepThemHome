import { count, sql } from 'drizzle-orm';
import { getDatabase } from '../db';
import {
  caseFactors, cases, interventionResources, interventions, outcomes, pets, recommendations, resources, users,
} from '../db/schema';
import { expectedProductionTables, verifyDeterministicCore } from '../production/verification';
import { listVerifiedResources } from '../services/resource-service';

const db = getDatabase();

const migrationResult = await db.execute<{ migration_count: number }>(sql`
  select count(*)::int as migration_count from drizzle.__drizzle_migrations
`);
const migrationCount = migrationResult.rows[0]?.migration_count ?? 0;
if (migrationCount < 3) throw new Error(`Expected at least 3 applied migrations; found ${migrationCount}`);

const tableCounts = await Promise.all([
  db.select({ value: count() }).from(users),
  db.select({ value: count() }).from(pets),
  db.select({ value: count() }).from(cases),
  db.select({ value: count() }).from(caseFactors),
  db.select({ value: count() }).from(outcomes),
  db.select({ value: count() }).from(resources),
  db.select({ value: count() }).from(interventions),
  db.select({ value: count() }).from(interventionResources),
  db.select({ value: count() }).from(recommendations),
]);
const counts = Object.fromEntries(expectedProductionTables.map((table, index) => [table, tableCounts[index][0].value]));

const firstResources = await listVerifiedResources();
const secondResources = await listVerifiedResources();
if (firstResources.length !== 8) throw new Error(`Expected 8 active verified resources; found ${firstResources.length}`);
if (new Set(firstResources.map(({ slug }) => slug)).size !== firstResources.length) throw new Error('Verified resources contain duplicate slugs');
if (JSON.stringify(firstResources) !== JSON.stringify(secondResources)) throw new Error('Repeated resource reads are not deterministic');

const core = verifyDeterministicCore();
console.log(JSON.stringify({
  ok: true,
  schema: { expectedTables: expectedProductionTables, counts, appliedMigrations: migrationCount },
  resources: { activeVerified: firstResources.length },
  deterministicCore: core,
  authentication: 'Not exercised: provide a real Clerk session to test production auth without bypassing it.',
  writesPerformed: 0,
}, null, 2));
