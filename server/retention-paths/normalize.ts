import type { CaseFactorRecord, CaseRecord } from '../db/schema';
import type { ConstraintKey, NormalizedHousingCase, RequirementState } from './domain';

const explicitBoolean = (value: string | null | undefined): RequirementState => {
  if (!value) return 'unknown';
  const normalized = value.trim().toLowerCase();
  if (['yes', 'true', 'available', 'possible', 'met'].includes(normalized)) return true;
  if (['no', 'false', 'unavailable', 'not possible', 'not met'].includes(normalized)) return false;
  return 'unknown';
};

export const normalizeHousingCase = (
  caseRecord: Pick<CaseRecord, 'primaryBarrier' | 'urgency' | 'goal'>,
  factors: Array<Pick<CaseFactorRecord, 'factorType' | 'factorValue'>>,
): NormalizedHousingCase => {
  const factorValue = (type: string) => factors.find((factor) => factor.factorType === type)?.factorValue;
  const goal = caseRecord.goal ?? factorValue('goal') ?? null;
  const behaviorValue = factorValue('behavior_contributor') ?? factorValue('contributing_barrier');
  const behaviorConcern = factorValue('behavior_concern');
  const behaviorContributor: RequirementState = behaviorValue?.toLowerCase() === 'behavior' || behaviorConcern
    ? true
    : explicitBoolean(behaviorValue);
  const constraints: Record<ConstraintKey, RequirementState> = {
    goalSupportsStay: goal === 'Stay where I am' || goal === 'Either could work' ? true : goal === 'Move' ? false : 'unknown',
    goalSupportsMove: goal === 'Move' || goal === 'Either could work' ? true : goal === 'Stay where I am' ? false : 'unknown',
    housingResolutionPossible: explicitBoolean(factorValue('housing_resolution_possible')),
    behaviorContributor,
    behaviorMitigationAvailable: explicitBoolean(factorValue('behavior_mitigation_available')),
    temporaryCareAvailable: explicitBoolean(factorValue('temporary_care_available')),
    underlyingIssueResolutionPossible: explicitBoolean(factorValue('underlying_issue_resolution_possible')),
    petFriendlyHousingAvailable: explicitBoolean(factorValue('pet_friendly_housing_available')),
    moveRequirementsMet: explicitBoolean(factorValue('move_requirements_met')),
  };

  return {
    primaryBarrier: caseRecord.primaryBarrier ?? factorValue('primary_barrier') ?? null,
    situation: factorValue('housing_situation') ?? null,
    urgency: caseRecord.urgency ?? factorValue('urgency') ?? null,
    goal,
    costConstraint: factorValue('cost_constraint') ?? null,
    constraints,
  };
};
