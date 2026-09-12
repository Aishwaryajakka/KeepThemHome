import { count, eq, inArray } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import { caseFactors, cases, recommendations, resources } from '../db/schema.js';
import { generateCasePlan } from '../services/plan-service.js';
import { listVerifiedResources } from '../services/resource-service.js';
import { addCaseAction, listCaseActions, listCaseEvents, recordActionOutcome, updateCaseAction } from '../services/action-service.js';
import { findSimilarCases } from '../services/similarity-service.js';
import { addOutcome, getOutcomes } from '../services/case-service.js';

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
  const [factorCountBeforeAction] = await db.select({ value: count() }).from(caseFactors).where(eq(caseFactors.caseId, caseId));
  const action = await addCaseAction(caseId, 'remain_in_current_housing', 'contact_landlord');
  if (!action) throw new Error('Action persistence verification failed');
  const completed = await updateCaseAction(caseId, action.id, { status: 'COMPLETED' });
  const [factorCountAfterCompletion] = await db.select({ value: count() }).from(caseFactors).where(eq(caseFactors.caseId, caseId));
  if (!completed || factorCountAfterCompletion.value !== factorCountBeforeAction.value) {
    throw new Error('Completing an action unexpectedly changed case facts');
  }
  const outcome = await recordActionOutcome(caseId, action.id, 'LANDLORD_CONTACT_ALLOWED_STAY');
  const restoredActions = await listCaseActions(caseId);
  const actionEvents = await listCaseEvents(caseId);
  if (outcome.status !== 'ok' || outcome.changedFact?.field !== 'housingResolutionPossible' || restoredActions[0]?.outcomeKey !== 'LANDLORD_CONTACT_ALLOWED_STAY' || actionEvents.length < 3) {
    throw new Error('Action outcome, restore, or timeline verification failed');
  }
  const similar = await findSimilarCases(caseId);
  const serialized = JSON.stringify(similar);
  if (similar.length < 2 || similar.some(({ provenance }) => provenance !== 'synthetic_example') || /userId|authSubject|email|rawStory|notes|address/i.test(serialized)) {
    throw new Error('Privacy-safe vector similarity verification failed');
  }
  await addOutcome(caseId, { status: 'KEEPING_PET', helpfulFactors: ['HOUSING_RESOLUTION'], notes: 'Private smoke note that must not enter similarity.' });
  const reportedOutcomes = await getOutcomes(caseId);
  const [lifecycle] = await db.select({ status: cases.currentStatus }).from(cases).where(eq(cases.id, caseId));
  const refreshedSimilar = await findSimilarCases(caseId);
  if (reportedOutcomes[0]?.status !== 'KEEPING_PET' || reportedOutcomes[0].helpfulFactors[0] !== 'HOUSING_RESOLUTION' || lifecycle.status !== 'KEEPING_PET' || JSON.stringify(refreshedSimilar).includes('Private smoke note')) {
    throw new Error('Outcome persistence, lifecycle, or private-note boundary verification failed');
  }
  console.log('Live verification passed: actions, outcomes, lifecycle, timeline, structured learning, and privacy-safe pgvector retrieval.');
} finally {
  if (caseId) await db.delete(cases).where(eq(cases.id, caseId));
  await db.delete(resources).where(inArray(resources.slug, smokeSlugs));
}
