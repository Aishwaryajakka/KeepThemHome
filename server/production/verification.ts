import { applySupportedChanges, exploreSmallestUnlock } from '../counterfactual/engine.js';
import { buildLunaSolverFacts } from '../demo/scenarios.js';
import { selectEvidenceForPath } from '../evidence/select.js';
import { rankHousingInterventions } from '../interventions/engine.js';
import { solveRetentionPaths } from '../retention-paths/solver.js';

export const expectedProductionTables = [
  'users', 'pets', 'cases', 'case_factors', 'outcomes', 'resources',
  'interventions', 'intervention_resources', 'recommendations', 'case_actions',
  'case_events', 'case_similarity_profiles',
] as const;

export const verifyDeterministicCore = () => {
  const actualFacts = buildLunaSolverFacts('Stay where I am');
  const originalSnapshot = structuredClone(actualFacts);
  const firstPaths = solveRetentionPaths(actualFacts);
  const secondPaths = solveRetentionPaths(actualFacts);
  if (JSON.stringify(firstPaths) !== JSON.stringify(secondPaths)) throw new Error('Luna solver output is not deterministic');
  const expectedPaths = ['remain_in_current_housing', 'temporary_care_bridge', 'move_with_pet'];
  if (firstPaths.map(({ key }) => key).join('|') !== expectedPaths.join('|')) throw new Error('Luna solver paths are incomplete');

  const moveUnlock = exploreSmallestUnlock(actualFacts, 'move_with_pet');
  if (!moveUnlock?.smallestUnlock) throw new Error('Luna move path has no supported Smallest Unlock');
  const recomputedFacts = applySupportedChanges(actualFacts, moveUnlock.smallestUnlock.changes);
  const recomputedMove = solveRetentionPaths(recomputedFacts).find(({ key }) => key === 'move_with_pet');
  if (recomputedMove?.status !== 'FEASIBLE') throw new Error('Luna hypothetical recomputation did not become feasible');
  if (JSON.stringify(actualFacts) !== JSON.stringify(originalSnapshot)) throw new Error('Hypothetical recomputation mutated actual Luna facts');

  const ranked = rankHousingInterventions({
    primaryBarrier: 'housing', situation: actualFacts.situation,
    urgency: actualFacts.urgency, goal: actualFacts.goal,
  });
  if (ranked[0]?.key !== 'clarify_housing_restriction') throw new Error('Unexpected top intervention for Luna');
  const stay = firstPaths.find(({ key }) => key === 'remain_in_current_housing');
  if (!stay) throw new Error('Luna stay path is unavailable');
  const firstEvidence = selectEvidenceForPath('synthetic-luna-verification', stay, actualFacts);
  const secondEvidence = selectEvidenceForPath('synthetic-luna-verification', stay, actualFacts);
  if (JSON.stringify(firstEvidence) !== JSON.stringify(secondEvidence) || firstEvidence.evidence.length === 0) {
    throw new Error('Luna evidence selection is unavailable or non-deterministic');
  }

  return {
    pathStatuses: Object.fromEntries(firstPaths.map(({ key, status }) => [key, status])),
    moveUnlockCodes: moveUnlock.smallestUnlock.changes.map(({ code }) => code),
    recomputedMoveStatus: recomputedMove.status,
    topIntervention: ranked[0].key,
    evidenceIds: firstEvidence.evidence.map(({ id }) => id),
  };
};
