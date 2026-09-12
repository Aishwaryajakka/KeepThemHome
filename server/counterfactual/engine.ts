import { materializeSupportedChanges, relevantSupportedChanges } from './catalog.js';
import type { SupportedChange, SupportedChangeCode, UnlockCandidate, UnlockResult } from './domain.js';
import type { NormalizedHousingCase, PathEvaluation } from '../retention-paths/domain.js';
import { solveRetentionPaths } from '../retention-paths/solver.js';

export const MAX_UNLOCK_CHANGES = 3;

export const applySupportedChanges = (
  facts: NormalizedHousingCase,
  changes: SupportedChange[],
): NormalizedHousingCase => {
  const next: NormalizedHousingCase = { ...facts, constraints: { ...facts.constraints } };
  for (const change of changes) {
    if (change.field === 'goal') {
      next.goal = String(change.to);
      next.constraints.goalSupportsStay = true;
      next.constraints.goalSupportsMove = true;
    } else {
      next.constraints[change.field] = change.to as true | false;
    }
  }
  return next;
};

export const generateCombinations = <T>(items: T[], size: number): T[][] => {
  if (size === 0) return [[]];
  return items.flatMap((item, index) =>
    generateCombinations(items.slice(index + 1), size - 1).map((rest) => [item, ...rest]));
};

export const orderUnlockCandidates = (candidates: UnlockCandidate[]) => [...candidates]
  .sort((a, b) => a.totalBurden - b.totalBurden
    || a.changes.map(({ code }) => code).join('|').localeCompare(b.changes.map(({ code }) => code).join('|')));

const targetPath = (facts: NormalizedHousingCase, pathKey: string): PathEvaluation | undefined =>
  solveRetentionPaths(facts).find((path) => path.key === pathKey);

const asCandidate = (changes: SupportedChange[], evaluation: PathEvaluation): UnlockCandidate => ({
  changes,
  changeCount: changes.length,
  totalBurden: changes.reduce((total, change) => total + change.burden, 0),
  resultingStatus: 'FEASIBLE',
  resultingPathEvaluation: evaluation,
});

export const exploreSmallestUnlock = (
  actualFacts: NormalizedHousingCase,
  pathKey: string,
  appliedCodes: SupportedChangeCode[] = [],
): UnlockResult | undefined => {
  const appliedChanges = materializeSupportedChanges(actualFacts, appliedCodes);
  const currentFacts = applySupportedChanges(actualFacts, appliedChanges);
  const current = targetPath(currentFacts, pathKey);
  if (!current) return undefined;
  const appliedOverrides = Object.fromEntries(appliedChanges.map((change) => [change.field, change.to]));
  if (current.status === 'FEASIBLE') {
    return {
      targetPathKey: pathKey, unlockNeeded: false, currentStatus: current.status,
      currentBlockers: [], smallestUnlock: null, alternatives: [], appliedChanges,
      appliedOverrides, currentPathEvaluation: current,
    };
  }

  const appliedSet = new Set(appliedCodes);
  const candidates = relevantSupportedChanges(currentFacts, current.blockers)
    .filter((change) => !appliedSet.has(change.code));
  for (let size = 1; size <= Math.min(MAX_UNLOCK_CHANGES, candidates.length); size += 1) {
    const viable = orderUnlockCandidates(generateCombinations(candidates, size).flatMap((changes) => {
      const evaluation = targetPath(applySupportedChanges(currentFacts, changes), pathKey);
      return evaluation?.status === 'FEASIBLE' ? [asCandidate(changes, evaluation)] : [];
    }));
    if (viable.length > 0) {
      return {
        targetPathKey: pathKey, unlockNeeded: true, currentStatus: current.status,
        currentBlockers: current.blockers, smallestUnlock: viable[0], alternatives: viable.slice(1, 3),
        appliedChanges, appliedOverrides, currentPathEvaluation: current,
      };
    }
  }
  return {
    targetPathKey: pathKey, unlockNeeded: true, currentStatus: current.status,
    currentBlockers: current.blockers, smallestUnlock: null, alternatives: [],
    appliedChanges, appliedOverrides, currentPathEvaluation: current,
  };
};
