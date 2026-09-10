import { count, eq, inArray } from 'drizzle-orm';
import { getDatabase } from '../db';
import { caseFactors, cases, recommendations, resources } from '../db/schema';
import { generateCasePlan } from '../services/plan-service';
import { listVerifiedResources } from '../services/resource-service';

const db = getDatabase();
const smokeSlugs = ['pass-5-inactive-smoke', 'pass-5-unverified-smoke'];
let caseId: string | undefined;

try {
  await db.insert(resources).values([
    {
      slug: smokeSlugs[0], name: 'Inactive smoke resource', category: 'general-support',
      description: 'Temporary verification row.', geographicScope: 'Test only',
      eligibilitySummary: 'Test only', costSummary: 'Test only', url: 'https://example.com',
      sourceName: 'Test only', verifiedAt: '2026-09-10', verificationStatus: 'verified', active: false,
    },
    {
      slug: smokeSlugs[1], name: 'Unverified smoke resource', category: 'general-support',
      description: 'Temporary verification row.', geographicScope: 'Test only',
      eligibilitySummary: 'Test only', costSummary: 'Test only', url: 'https://example.com',
      sourceName: 'Test only', verifiedAt: '2026-09-10', verificationStatus: 'pending', active: true,
    },
  ]).onConflictDoNothing();

  const visible = await listVerifiedResources();
  if (visible.length !== 8 || visible.some(({ slug }) => smokeSlugs.includes(slug))) {
    throw new Error('Resource visibility verification failed');
  }

  const [created] = await db.insert(cases).values({
    petName: 'Pass 5 smoke test', petType: 'dog', primaryBarrier: 'housing',
    urgency: 'This week', goal: 'Stay where I am',
  }).returning({ id: cases.id });
  caseId = created.id;
  await db.insert(caseFactors).values({
    caseId,
    factorType: 'housing_situation',
    factorValue: 'My landlord or property says pets aren’t allowed',
    role: 'contributing',
    source: 'structured',
  });

  const first = await generateCasePlan(caseId);
  const second = await generateCasePlan(caseId);
  const [persisted] = await db.select({ value: count() }).from(recommendations)
    .where(eq(recommendations.caseId, caseId));
  if (!first || !second || first.interventions.length !== 3 || persisted.value !== 3) {
    throw new Error('Plan persistence verification failed');
  }
  if (first.interventions[0]?.key !== 'clarify_housing_restriction') {
    throw new Error('Unexpected top intervention for Luna Housing facts');
  }
  console.log('Live verification passed: 8 visible resources, ranked plan read twice, 3 unique recommendations.');
} finally {
  if (caseId) await db.delete(cases).where(eq(cases.id, caseId));
  await db.delete(resources).where(inArray(resources.slug, smokeSlugs));
}
