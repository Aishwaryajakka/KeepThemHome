import { and, asc, eq } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import {
  caseFactors,
  cases,
  interventionResources,
  interventions,
  resources,
} from '../db/schema.js';
import { normalizeHousingCase } from '../retention-paths/normalize.js';
import { solveRetentionPaths } from '../retention-paths/solver.js';
import { applySupportedChanges } from '../counterfactual/engine.js';
import { materializeSupportedChanges } from '../counterfactual/catalog.js';
import type { SupportedChangeCode } from '../counterfactual/domain.js';

export const loadNormalizedHousingCase = async (caseId: string) => {
  const db = getDatabase();
  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) return undefined;
  const factors = await db.select().from(caseFactors).where(eq(caseFactors.caseId, caseId));
  return normalizeHousingCase(caseRecord, factors);
};

export const generateRetentionPaths = async (caseId: string, appliedCodes: SupportedChangeCode[] = []) => {
  const db = getDatabase();
  const actualFacts = await loadNormalizedHousingCase(caseId);
  if (!actualFacts) return undefined;
  const appliedChanges = materializeSupportedChanges(actualFacts, appliedCodes);
  const facts = applySupportedChanges(actualFacts, appliedChanges);
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
    appliedChanges,
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
