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
  const contributors = new Set(facts.contributingBarriers ?? []);
  const sharedRequirements: RetentionPathDefinition['requirements'] = path.domain === 'housing' ? [] : [
    ...(contributors.has('housing') ? [{ key: 'contributing_housing', fact: 'housingResolutionPossible' as const, requiredValue: true as const, label: 'The contributing housing pressure still needs a workable resolution.', requiredCondition: 'Housing pressure can be addressed' }] : []),
    ...(contributors.has('behavior') ? [{ key: 'contributing_behavior', fact: 'behaviorMitigationAvailable' as const, requiredValue: true as const, label: 'The contributing behavior pressure still needs a workable mitigation.', requiredCondition: 'Behavior mitigation is available' }] : []),
    ...(contributors.has('cost') ? [{ key: 'contributing_cost', fact: 'costReductionPossible' as const, requiredValue: true as const, label: 'The contributing cost pressure still needs an affordable route.', requiredCondition: 'Cost pressure can be reduced' }] : []),
    ...(contributors.has('medical') ? [{ key: 'contributing_medical', fact: 'careAccessPossible' as const, requiredValue: true as const, label: 'Access to appropriate veterinary care still needs confirmation.', requiredCondition: 'Appropriate care is accessible' }] : []),
    ...(contributors.has('temporary_crisis') ? [{ key: 'contributing_crisis', fact: 'temporaryCareAvailable' as const, requiredValue: true as const, label: 'Temporary support for the crisis has not been confirmed.', requiredCondition: 'Temporary crisis support is available' }] : []),
    ...(contributors.has('time_capacity') ? [{ key: 'contributing_capacity', fact: 'careSupportAvailable' as const, requiredValue: true as const, label: 'Caregiving support for the time pressure has not been confirmed.', requiredCondition: 'Caregiving support is available' }] : []),
    ...(contributors.has('circumstances') ? [{ key: 'contributing_life_change', fact: 'householdAdaptationPossible' as const, requiredValue: true as const, label: 'A workable response to the household change has not been confirmed.', requiredCondition: 'Household adaptation is possible' }] : []),
  ];
  const applicableRequirements = [...path.requirements, ...sharedRequirements].filter((requirement) =>
    !requirement.appliesWhen
      || facts.constraints[requirement.appliesWhen.fact] === requirement.appliesWhen.value);
  const requirements = Array.from(new Map(applicableRequirements.map((requirement) => [requirement.fact, requirement])).values());
  const blockers: PathBlocker[] = requirements.flatMap((requirement) => {
    const currentValue = facts.constraints[requirement.fact] ?? 'unknown';
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
    `${(facts.primaryBarrier ?? 'GENERAL').toUpperCase()}_BARRIER`,
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
    .filter((path) => !path.domain || path.domain === facts.primaryBarrier)
    .map((path, index) => evaluatePath(path, facts, index))
    .sort((a, b) => b.rankScore - a.rankScore || a.catalogIndex - b.catalogIndex)
    .map(({ catalogIndex: _catalogIndex, ...path }) => path);
