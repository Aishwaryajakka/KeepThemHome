import type { ConstraintKey, NormalizedHousingCase, PathBlocker, PathEvaluation } from '../retention-paths/domain';

export type SupportedChangeCode =
  | 'ALLOW_STAY_OR_MOVE'
  | 'CONFIRM_HOUSING_RESOLUTION'
  | 'CONFIRM_BEHAVIOR_MITIGATION'
  | 'CONFIRM_TEMPORARY_CARE'
  | 'CONFIRM_UNDERLYING_ISSUE_RESOLUTION'
  | 'CONFIRM_PET_FRIENDLY_HOUSING'
  | 'CONFIRM_MOVE_REQUIREMENTS';

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
