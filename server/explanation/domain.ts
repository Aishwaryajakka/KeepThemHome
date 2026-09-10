import type { SupportedChange } from '../counterfactual/domain';
import type { PathBlocker, PathStatus } from '../retention-paths/domain';
import type { ExplanationMode } from '../validation/explanation';

export interface GroundedExplanationPayload {
  pet: { name: string; type: string };
  ownerGoal: string | null;
  mode: ExplanationMode;
  selectedPath: {
    key: string;
    title: string;
    objective: string;
    status: PathStatus;
    rank: number;
    orderedSteps: Array<{ title: string; description: string }>;
    reasonCodes: string[];
    blockers: PathBlocker[];
  };
  smallestUnlock: {
    changes: SupportedChange[];
    resultingStatus: 'FEASIBLE';
  } | null;
  appliedChanges: SupportedChange[];
  resources: Array<{ name: string; description: string; url: string; relevantStep: string }>;
  safetyState: 'ACTIVE' | 'NOT_ACTIVE';
  isHypothetical: boolean;
}
