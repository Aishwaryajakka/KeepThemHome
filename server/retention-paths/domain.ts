export type PathStatus = 'FEASIBLE' | 'CONDITIONAL' | 'BLOCKED';
export type RequirementState = true | false | 'unknown';

export type ConstraintKey =
  | 'goalSupportsStay'
  | 'goalSupportsMove'
  | 'housingResolutionPossible'
  | 'behaviorContributor'
  | 'behaviorMitigationAvailable'
  | 'temporaryCareAvailable'
  | 'underlyingIssueResolutionPossible'
  | 'petFriendlyHousingAvailable'
  | 'moveRequirementsMet';

export interface NormalizedHousingCase {
  primaryBarrier: string | null;
  situation: string | null;
  urgency: string | null;
  goal: string | null;
  costConstraint: string | null;
  constraints: Record<ConstraintKey, RequirementState>;
}

export interface PathRequirement {
  key: string;
  fact: ConstraintKey;
  requiredValue: true;
  label: string;
  requiredCondition: string;
  appliesWhen?: { fact: ConstraintKey; value: RequirementState };
}

export interface RetentionStep {
  key: string;
  title: string;
  description: string;
  interventionKey?: string;
}

export interface RetentionPathDefinition {
  key: string;
  title: string;
  objective: string;
  disruption: number;
  goalAlignment: 'stay' | 'move' | 'either';
  steps: RetentionStep[];
  requirements: PathRequirement[];
}

export interface PathBlocker {
  code: string;
  type: 'PRECONDITION';
  field: ConstraintKey;
  currentValue: false | 'unknown';
  requiredCondition: string;
  status: 'KNOWN_CONFLICT' | 'UNKNOWN';
  label: string;
}

export interface PathEvaluation {
  key: string;
  title: string;
  objective: string;
  status: PathStatus;
  statusReason: string;
  steps: RetentionStep[];
  blockers: PathBlocker[];
  reasonCodes: string[];
  rankScore: number;
  friction: number;
}
