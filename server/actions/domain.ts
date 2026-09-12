import type { ConstraintKey } from '../retention-paths/domain';

export const actionStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'NOT_POSSIBLE'] as const;
export const notPossibleReasons = ['COST', 'NO_AVAILABILITY', 'NOT_ELIGIBLE', 'NO_RESPONSE', 'TIME', 'TRANSPORTATION', 'SAFETY', 'HOUSING', 'HOUSEHOLD', 'OTHER'] as const;
export type ActionStatus = typeof actionStatuses[number];
export type NotPossibleReason = typeof notPossibleReasons[number];

export interface ActionDefinition {
  key: string; pathKey: string; interventionKey?: string; relatedFact: ConstraintKey;
  title: string; description: string;
  outcomes: Array<{ key: string; label: string; factValue?: true | false }>;
}
