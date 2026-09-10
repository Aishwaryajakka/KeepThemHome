import { and, asc, eq } from 'drizzle-orm';
import { getDatabase } from '../db';
import {
  caseFactors,
  cases,
  interventionResources,
  interventions,
  resources,
} from '../db/schema';
import { normalizeHousingCase } from '../retention-paths/normalize';
import { solveRetentionPaths } from '../retention-paths/solver';

export const generateRetentionPaths = async (caseId: string) => {
  const db = getDatabase();
  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) return undefined;
  const factors = await db.select().from(caseFactors).where(eq(caseFactors.caseId, caseId));
  const facts = normalizeHousingCase(caseRecord, factors);
  if (facts.primaryBarrier !== 'housing') return { caseId, paths: [] };

  const paths = solveRetentionPaths(facts);
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
    facts: {
      primaryBarrier: facts.primaryBarrier,
      situation: facts.situation,
      urgency: facts.urgency,
      goal: facts.goal,
      behaviorContributor: facts.constraints.behaviorContributor,
      costConstraint: facts.costConstraint,
    },
    paths: paths.map((path) => ({
      ...path,
      steps: path.steps.map((step) => ({
        ...step,
        resources: step.interventionKey
          ? linked
            .filter((row) => row.interventionKey === step.interventionKey)
            .sort((a, b) => b.relevanceWeight - a.relevanceWeight)
            .slice(0, 2)
            .map(({ resource }) => resource)
          : [],
      })),
    })),
  };
};
