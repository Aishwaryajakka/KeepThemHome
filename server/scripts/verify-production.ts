import { count, sql } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import {
  caseActions, caseEvents, caseFactors, caseSimilarityProfiles, cases, interventionResources, interventions, outcomes, pets, recommendations, resources, users,
} from '../db/schema.js';
import { expectedProductionTables, verifyDeterministicCore } from '../production/verification.js';
import { listVerifiedResources } from '../services/resource-service.js';

const db = getDatabase();

const migrationResult = await db.execute<{ migration_count: number }>(sql`
  select count(*)::int as migration_count from drizzle.__drizzle_migrations
`);
const migrationCount = migrationResult.rows[0]?.migration_count ?? 0;
if (migrationCount < 5) throw new Error(`Expected at least 5 applied migrations; found ${migrationCount}`);

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
  db.select({ value: count() }).from(caseActions),
  db.select({ value: count() }).from(caseEvents),
  db.select({ value: count() }).from(caseSimilarityProfiles),
]);
const counts = Object.fromEntries(expectedProductionTables.map((table, index) => [table, tableCounts[index][0].value]));

const firstResources = await listVerifiedResources();
const secondResources = await listVerifiedResources();
if (firstResources.length !== 8) throw new Error(`Expected 8 active verified resources; found ${firstResources.length}`);
if (new Set(firstResources.map(({ slug }) => slug)).size !== firstResources.length) throw new Error('Verified resources contain duplicate slugs');
if (JSON.stringify(firstResources) !== JSON.stringify(secondResources)) throw new Error('Repeated resource reads are not deterministic');

const core = verifyDeterministicCore();
const vectorExtension = await db.execute<{ installed: boolean }>(sql`select exists(select 1 from pg_extension where extname = 'vector') as installed`);
if (!vectorExtension.rows[0]?.installed) throw new Error('pgvector extension is not installed');
console.log(JSON.stringify({
  ok: true,
  schema: { expectedTables: expectedProductionTables, counts, appliedMigrations: migrationCount },
  resources: { activeVerified: firstResources.length },
  deterministicCore: core,
  pgvector: { installed: true },
  authentication: 'Not exercised: provide a real Clerk session to test production auth without bypassing it.',
  writesPerformed: 0,
}, null, 2));
