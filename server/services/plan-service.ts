import { createHash } from 'node:crypto';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import {
  caseFactors,
  cases,
  interventionResources,
  interventions,
  recommendations,
  resources,
} from '../db/schema.js';
import { rankHousingInterventions } from '../interventions/engine.js';

export const generateCasePlan = async (caseId: string) => {
  const db = getDatabase();
  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) return undefined;

  const factors = await db.select().from(caseFactors).where(eq(caseFactors.caseId, caseId));
  const factorValue = (type: string) => factors.find((factor) => factor.factorType === type)?.factorValue;
  const primaryBarrier = caseRecord.primaryBarrier ?? factorValue('primary_barrier');
  if (primaryBarrier !== 'housing') return { caseId, interventions: [] };

  const facts = {
    primaryBarrier,
    situation: factorValue('housing_situation'),
    urgency: caseRecord.urgency ?? factorValue('urgency'),
    goal: caseRecord.goal ?? factorValue('goal'),
  } as const;
  const fingerprint = createHash('sha256').update(JSON.stringify(facts)).digest('hex');
  const ranked = rankHousingInterventions(facts).slice(0, 3);

  await db.delete(recommendations).where(and(
    eq(recommendations.caseId, caseId),
    ne(recommendations.factsFingerprint, fingerprint),
  ));
  if (ranked.length > 0) {
    await db.insert(recommendations).values(ranked.map((item, index) => ({
      caseId,
      interventionKey: item.key,
      rank: index + 1,
      score: item.score,
      reasonCodes: item.reasons,
      generatedBy: 'rules',
      factsFingerprint: fingerprint,
    }))).onConflictDoUpdate({
      target: [recommendations.caseId, recommendations.factsFingerprint, recommendations.interventionKey],
      set: {
        rank: sql`excluded.rank`,
        score: sql`excluded.score`,
        reasonCodes: sql`excluded.reason_codes`,
        generatedBy: 'rules',
      },
    });
  }

  const linked = await db.select({
    interventionKey: interventions.key,
    resource: resources,
    relevanceWeight: interventionResources.relevanceWeight,
  }).from(interventionResources)
    .innerJoin(interventions, eq(interventionResources.interventionId, interventions.id))
    .innerJoin(resources, eq(interventionResources.resourceId, resources.id))
    .where(and(
      eq(interventions.active, true),
      eq(resources.active, true),
      eq(resources.verificationStatus, 'verified'),
    ))
    .orderBy(asc(resources.createdAt));

  return {
    caseId,
    interventions: ranked.map((item) => ({
      key: item.key,
      title: item.title,
      description: item.description,
      score: item.score,
      reasons: item.reasons,
      resources: linked
        .filter((row) => row.interventionKey === item.key)
        .sort((a, b) => b.relevanceWeight - a.relevanceWeight)
        .slice(0, 1)
        .map(({ resource }) => resource),
    })),
  };
};
