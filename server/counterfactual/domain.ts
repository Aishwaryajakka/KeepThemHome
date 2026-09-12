import type { ConstraintKey, NormalizedHousingCase, PathBlocker, PathEvaluation } from '../retention-paths/domain';

export type SupportedChangeCode =
  | 'ALLOW_STAY_OR_MOVE'
  | 'CONFIRM_HOUSING_RESOLUTION'
  | 'CONFIRM_BEHAVIOR_MITIGATION'
  | 'CONFIRM_TEMPORARY_CARE'
  | 'CONFIRM_UNDERLYING_ISSUE_RESOLUTION'
  | 'CONFIRM_PET_FRIENDLY_HOUSING'
  | 'CONFIRM_MOVE_REQUIREMENTS'
  | 'CONFIRM_BEHAVIOR_MANAGEMENT'
  | 'CONFIRM_BEHAVIOR_SUPPORT_ACCESS'
  | 'CONFIRM_SAFE_SEPARATION'
  | 'CONFIRM_COST_REDUCTION'
  | 'CONFIRM_FINANCIAL_BRIDGE'
  | 'CONFIRM_AFFORDABLE_ALTERNATIVE'
  | 'CONFIRM_CARE_ACCESS'
  | 'CONFIRM_VET_COST_SUPPORT'
  | 'CONFIRM_TRANSPORT_SUPPORT'
  | 'CONFIRM_CRISIS_TEMPORARY_CARE'
  | 'CONFIRM_TRUSTED_CAREGIVER'
  | 'CONFIRM_REUNIFICATION_PLAN'
  | 'CONFIRM_CARE_SUPPORT'
  | 'CONFIRM_ROUTINE_CHANGE'
  | 'CONFIRM_SHARED_CARE'
  | 'CONFIRM_HOUSEHOLD_ADAPTATION'
  | 'CONFIRM_TEMPORARY_BRIDGE'
  | 'CONFIRM_MOVE_WITH_PET'
  | 'CONFIRM_CONTRIBUTING_COST_REDUCTION'
  | 'CONFIRM_CONTRIBUTING_CARE_ACCESS'
  | 'CONFIRM_CONTRIBUTING_CARE_SUPPORT'
  | 'CONFIRM_CONTRIBUTING_HOUSEHOLD_ADAPTATION';

export type HypotheticalField = 'goal' | Exclude<ConstraintKey, 'goalSupportsStay' | 'goalSupportsMove' | 'behaviorContributor'>;

export interface SupportedChange {
  code: SupportedChangeCode;
  field: HypotheticalField;
  from: string | boolean | 'unknown';
  to: string | boolean;
  label: string;
  burden: number;
  source: 'supported_catalog';
}

export interface UnlockCandidate {
  changes: SupportedChange[];
  changeCount: number;
  totalBurden: number;
  resultingStatus: 'FEASIBLE';
  resultingPathEvaluation: PathEvaluation;
}

export interface UnlockResult {
  targetPathKey: string;
  unlockNeeded: boolean;
  currentStatus: PathEvaluation['status'];
  currentBlockers: PathBlocker[];
  smallestUnlock: UnlockCandidate | null;
  alternatives: UnlockCandidate[];
  appliedChanges: SupportedChange[];
  appliedOverrides: Partial<NormalizedHousingCase['constraints']> & { goal?: string };
  currentPathEvaluation: PathEvaluation;
}
