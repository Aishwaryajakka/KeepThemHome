import { retentionPathCatalog } from './catalog';
import type {
  NormalizedHousingCase,
  PathBlocker,
  PathEvaluation,
  PathStatus,
  RetentionPathDefinition,
} from './domain';

const statusBase: Record<PathStatus, number> = { FEASIBLE: 300, CONDITIONAL: 200, BLOCKED: 100 };

const evaluatePath = (
  path: RetentionPathDefinition,
  facts: NormalizedHousingCase,
  catalogIndex: number,
): PathEvaluation & { catalogIndex: number } => {
  const requirements = path.requirements.filter((requirement) =>
    !requirement.appliesWhen
      || facts.constraints[requirement.appliesWhen.fact] === requirement.appliesWhen.value);
  const blockers: PathBlocker[] = requirements.flatMap((requirement) => {
    const currentValue = facts.constraints[requirement.fact];
    if (currentValue === true) return [];
    return [{
      code: currentValue === false ? 'KNOWN_CONSTRAINT_CONFLICT' : 'UNKNOWN_REQUIREMENT',
      type: 'PRECONDITION' as const,
      field: requirement.fact,
      currentValue,
      requiredCondition: requirement.requiredCondition,
      status: currentValue === false ? 'KNOWN_CONFLICT' as const : 'UNKNOWN' as const,
      label: requirement.label,
    }];
  });
  const knownConflicts = blockers.filter(({ status }) => status === 'KNOWN_CONFLICT').length;
  const unknowns = blockers.filter(({ status }) => status === 'UNKNOWN').length;
  const status: PathStatus = knownConflicts > 0 ? 'BLOCKED' : unknowns > 0 ? 'CONDITIONAL' : 'FEASIBLE';
  const goalAligned = (path.goalAlignment === 'stay' && facts.constraints.goalSupportsStay === true)
    || (path.goalAlignment === 'move' && facts.constraints.goalSupportsMove === true)
    || path.goalAlignment === 'either';
  const reasonCodes = [
    'HOUSING_BARRIER',
    ...(facts.constraints.behaviorContributor === true ? ['BEHAVIOR_CONTRIBUTOR'] : []),
    ...(facts.costConstraint ? ['COST_CONSTRAINT'] : []),
    ...(facts.urgency === 'This week' || facts.urgency === 'Today or within 48 hours' ? ['URGENT_CASE'] : []),
    ...(facts.goal === 'Stay where I am' ? ['GOAL_STAY'] : []),
    ...(facts.goal === 'Move' ? ['GOAL_MOVE'] : []),
    ...(status === 'FEASIBLE' ? ['PATH_REQUIREMENTS_MET'] : []),
    ...(unknowns > 0 ? ['UNKNOWN_REQUIREMENT'] : []),
    ...(knownConflicts > 0 ? ['KNOWN_CONSTRAINT_CONFLICT'] : []),
  ];
  const friction = path.disruption + unknowns + (knownConflicts * 3);
  const rankScore = statusBase[status] + (goalAligned ? 20 : 0) - (path.disruption * 5) - (unknowns * 3) - (knownConflicts * 10);
  const statusReason = status === 'FEASIBLE'
    ? 'All currently modeled requirements for this path are explicitly satisfied.'
    : status === 'BLOCKED'
      ? 'A known case fact conflicts with at least one required condition.'
      : 'One or more required conditions are still unknown.';
  return {
    key: path.key,
    title: path.title,
    objective: path.objective,
    steps: path.steps,
    status,
    statusReason,
    blockers,
    reasonCodes,
    rankScore,
    friction,
    catalogIndex,
  };
};

export const solveRetentionPaths = (
  facts: NormalizedHousingCase,
  catalog: RetentionPathDefinition[] = retentionPathCatalog,
): PathEvaluation[] =>
  catalog
    .map((path, index) => evaluatePath(path, facts, index))
    .sort((a, b) => b.rankScore - a.rankScore || a.catalogIndex - b.catalogIndex)
    .map(({ catalogIndex: _catalogIndex, ...path }) => path);
