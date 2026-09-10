export type ApiPetType = 'dog' | 'cat' | 'other';
export type ApiBarrier = 'housing' | 'behavior' | 'cost' | 'medical' | 'temporary_crisis' | 'time_capacity' | 'circumstances';
export type ApiCaseStatus = 'active' | 'keeping' | 'still_trying' | 'rehoming_help' | 'closed';
export type ApiOutcomeStatus = 'keeping' | 'still_trying' | 'rehoming_help';

export interface CaseResponse {
  id: string;
  petName: string;
  petType: ApiPetType;
  primaryBarrier: ApiBarrier | null;
  urgency: string | null;
  goal: string | null;
  currentStatus: ApiCaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseInput {
  petName: string;
  petType: ApiPetType;
  primaryBarrier?: ApiBarrier | null;
  urgency?: string | null;
  goal?: string | null;
  currentStatus?: ApiCaseStatus;
}

export type UpdateCaseInput = Partial<CreateCaseInput>;

export interface FactorInput {
  factorType: string;
  factorValue?: string | null;
  role: 'primary' | 'contributing' | 'constraint';
  source: 'structured' | 'ai';
  confidence?: number | null;
}

export interface PlanResource {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  geographicScope: string;
  eligibilitySummary: string;
  costSummary: string;
  url: string;
  sourceName: string;
  verifiedAt: string;
  tags: string[];
}

export interface PlanIntervention {
  key: string;
  title: string;
  description: string;
  score: number;
  reasons: string[];
  resources: PlanResource[];
}

export interface CasePlan {
  caseId: string;
  interventions: PlanIntervention[];
}

export type RetentionPathStatus = 'FEASIBLE' | 'CONDITIONAL' | 'BLOCKED';

export interface RetentionPathBlocker {
  code: string;
  type: 'PRECONDITION';
  field: string;
  currentValue: false | 'unknown';
  requiredCondition: string;
  status: 'KNOWN_CONFLICT' | 'UNKNOWN';
  label: string;
}

export interface RetentionPathStep {
  key: string;
  title: string;
  description: string;
  interventionKey?: string;
  resources: PlanResource[];
}

export interface RetentionPathResult {
  key: string;
  title: string;
  objective: string;
  status: RetentionPathStatus;
  statusReason: string;
  steps: RetentionPathStep[];
  blockers: RetentionPathBlocker[];
  reasonCodes: string[];
  rankScore: number;
  friction: number;
}

export interface RetentionPathsResponse {
  caseId: string;
  facts: {
    primaryBarrier: string | null;
    situation: string | null;
    urgency: string | null;
    goal: string | null;
    behaviorContributor: true | false | 'unknown';
    costConstraint: string | null;
  };
  appliedChanges: SupportedChange[];
  paths: RetentionPathResult[];
}

export type SupportedChangeCode =
  | 'ALLOW_STAY_OR_MOVE'
  | 'CONFIRM_HOUSING_RESOLUTION'
  | 'CONFIRM_BEHAVIOR_MITIGATION'
  | 'CONFIRM_TEMPORARY_CARE'
  | 'CONFIRM_UNDERLYING_ISSUE_RESOLUTION'
  | 'CONFIRM_PET_FRIENDLY_HOUSING'
  | 'CONFIRM_MOVE_REQUIREMENTS';

export interface SupportedChange {
  code: SupportedChangeCode;
  field: string;
  from: string | boolean;
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
  resultingPathEvaluation: RetentionPathResult;
}

export interface UnlockResponse {
  targetPathKey: string;
  unlockNeeded: boolean;
  currentStatus: RetentionPathStatus;
  currentBlockers: RetentionPathBlocker[];
  smallestUnlock: UnlockCandidate | null;
  alternatives: UnlockCandidate[];
  appliedChanges: SupportedChange[];
  appliedOverrides: Record<string, string | boolean>;
  currentPathEvaluation: RetentionPathResult;
}

export type ExplanationMode = 'PATH_SUMMARY' | 'BLOCKER_EXPLANATION' | 'UNLOCK_EXPLANATION' | 'ACTION_PLAN_SUMMARY';

export interface PathExplanation {
  status: RetentionPathStatus;
  isHypothetical: boolean;
  headline: string;
  summary: string;
  why: string;
  nextStep: string;
  resourceNames: string[];
}

export interface ExplanationResponse {
  explanation: PathExplanation;
  source: 'generated' | 'deterministic';
  grounded: { pathKey: string; status: RetentionPathStatus; rank: number; isHypothetical: boolean };
}

const explanationCache = new Map<string, Promise<ExplanationResponse>>();

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`Case API request failed with status ${response.status}`);
  return response.json() as Promise<T>;
};

export const caseApi = {
  createCase: async (input: CreateCaseInput) =>
    (await requestJson<{ case: CaseResponse }>('/api/cases', {
      method: 'POST', body: JSON.stringify(input),
    })).case,

  getCase: async (id: string) =>
    (await requestJson<{ case: CaseResponse }>(`/api/cases/${id}`)).case,

  updateCase: async (id: string, input: UpdateCaseInput) =>
    (await requestJson<{ case: CaseResponse }>(`/api/cases/${id}`, {
      method: 'PATCH', body: JSON.stringify(input),
    })).case,

  recordFactors: async (id: string, factors: FactorInput[]) =>
    requestJson(`/api/cases/${id}/factors`, {
      method: 'POST', body: JSON.stringify({ factors }),
    }),

  recordOutcome: async (id: string, status: ApiOutcomeStatus) =>
    requestJson(`/api/cases/${id}/outcomes`, {
      method: 'POST', body: JSON.stringify({ status }),
    }),

  getPlan: async (id: string) =>
    requestJson<CasePlan>(`/api/cases/${id}/plan`, { method: 'POST' }),

  getRetentionPaths: async (id: string, appliedChanges: SupportedChangeCode[] = []) =>
    requestJson<RetentionPathsResponse>(`/api/cases/${id}/paths`, {
      method: 'POST', body: JSON.stringify({ appliedChanges }),
    }),

  getSmallestUnlock: async (id: string, pathKey: string, appliedChanges: SupportedChangeCode[] = []) =>
    requestJson<UnlockResponse>(`/api/cases/${id}/paths/${pathKey}/unlock`, {
      method: 'POST', body: JSON.stringify({ appliedChanges }),
    }),

  getPathExplanation: async (
    id: string,
    pathKey: string,
    mode: ExplanationMode,
    appliedChanges: SupportedChangeCode[] = [],
  ) => {
    const key = JSON.stringify([id, pathKey, mode, [...appliedChanges].sort()]);
    const cached = explanationCache.get(key);
    if (cached) return cached;
    const request = requestJson<ExplanationResponse>(`/api/cases/${id}/explain`, {
      method: 'POST', body: JSON.stringify({ pathKey, mode, appliedChanges }),
    });
    explanationCache.set(key, request);
    request.catch(() => explanationCache.delete(key));
    return request;
  },
};
