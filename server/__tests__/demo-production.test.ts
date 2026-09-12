import { describe, expect, it } from 'vitest';
import { applySupportedChanges, exploreSmallestUnlock } from '../counterfactual/engine';
import { demoSeedManifest, DEMO_SOURCE, buildLunaSolverFacts, syntheticDemoScenarios } from '../demo/scenarios';
import { selectEvidenceForPath } from '../evidence/select';
import { expectedProductionTables, verifyDeterministicCore } from '../production/verification';
import { solveRetentionPaths } from '../retention-paths/solver';
import { verifiedCatalogManifest } from '../services/seed-service';

describe('production-safe synthetic demo contract', () => {
  it('identifies six unique scenarios as synthetic and persists none of them', () => {
    expect(syntheticDemoScenarios).toHaveLength(6);
    expect(new Set(syntheticDemoScenarios.map(({ id }) => id))).toHaveProperty('size', 6);
    expect(syntheticDemoScenarios.every(({ synthetic, source }) => synthetic && source === DEMO_SOURCE)).toBe(true);
    expect(syntheticDemoScenarios.filter(({ solverSupport }) => solverSupport === 'full-housing').map(({ name }) => name)).toEqual(['Luna']);
    expect(demoSeedManifest()).toEqual(demoSeedManifest());
    expect(demoSeedManifest().databaseWrites).toEqual([]);
    expect(demoSeedManifest().persistence).toBe('ephemeral-client-only');
  });

  it('keeps Luna’s extracted goal unknown until it is separately supplied', () => {
    const facts = buildLunaSolverFacts();
    expect(facts).toMatchObject({
      primaryBarrier: 'housing', contributingBarriers: ['behavior', 'cost'], urgency: 'This week', goal: null,
      costConstraint: 'Cannot afford a trainer',
    });
    expect(facts.constraints.goalSupportsStay).toBe('unknown');
    expect(facts.constraints.goalSupportsMove).toBe('unknown');
  });

  it('locks the complete Luna solver and Smallest Unlock contract', () => {
    const facts = buildLunaSolverFacts('Stay where I am');
    const original = structuredClone(facts);
    const paths = solveRetentionPaths(facts);
    expect(paths.map(({ key }) => key)).toEqual([
      'remain_in_current_housing', 'temporary_care_bridge', 'move_with_pet',
    ]);
    expect(paths.every(({ status }) => ['FEASIBLE', 'CONDITIONAL', 'BLOCKED'].includes(status))).toBe(true);
    expect(paths.flatMap(({ blockers }) => blockers).every(({ code, field, status }) => code && field && status)).toBe(true);

    const unlock = exploreSmallestUnlock(facts, 'move_with_pet')!;
    expect(unlock.smallestUnlock?.changes.map(({ code }) => code)).toEqual([
      'ALLOW_STAY_OR_MOVE', 'CONFIRM_PET_FRIENDLY_HOUSING', 'CONFIRM_MOVE_REQUIREMENTS',
    ]);
    const hypothetical = applySupportedChanges(facts, unlock.smallestUnlock!.changes);
    expect(solveRetentionPaths(hypothetical).find(({ key }) => key === 'move_with_pet')?.status).toBe('FEASIBLE');
    expect(facts).toEqual(original);
  });

  it('keeps evidence and resource manifests deterministic and duplicate-free', () => {
    const facts = buildLunaSolverFacts('Stay where I am');
    const stay = solveRetentionPaths(facts)[0];
    const firstEvidence = selectEvidenceForPath('synthetic-luna', stay, facts);
    const secondEvidence = selectEvidenceForPath('synthetic-luna', stay, facts);
    expect(firstEvidence).toEqual(secondEvidence);
    expect(new Set(firstEvidence.evidence.map(({ id }) => id)).size).toBe(firstEvidence.evidence.length);

    const firstResources = verifiedCatalogManifest();
    const secondResources = verifiedCatalogManifest();
    expect(firstResources).toEqual(secondResources);
    expect(new Set(firstResources.resourceSlugs).size).toBe(8);
    expect(new Set(firstResources.interventionKeys).size).toBe(20);
  });

  it('runs the read-only production core checks and expects the complete schema', () => {
    expect(expectedProductionTables).toHaveLength(9);
    expect(verifyDeterministicCore()).toMatchObject({
      pathStatuses: { remain_in_current_housing: 'CONDITIONAL', temporary_care_bridge: 'CONDITIONAL', move_with_pet: 'BLOCKED' },
      moveUnlockCodes: ['ALLOW_STAY_OR_MOVE', 'CONFIRM_PET_FRIENDLY_HOUSING', 'CONFIRM_MOVE_REQUIREMENTS'],
      recomputedMoveStatus: 'FEASIBLE',
      topIntervention: 'clarify_housing_restriction',
    });
  });
});
