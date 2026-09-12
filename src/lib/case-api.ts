export type ApiPetType = 'dog' | 'cat' | 'other';
export type ApiBarrier = 'housing' | 'behavior' | 'cost' | 'medical' | 'temporary_crisis' | 'time_capacity' | 'circumstances';
export type ApiCaseStatus = 'ACTIVE' | 'KEEPING_PET' | 'REHOMING_SUPPORT' | 'ARCHIVED' | 'active' | 'keeping' | 'still_trying' | 'rehoming_help' | 'closed';
export type ApiOutcomeStatus = 'KEEPING_PET' | 'STILL_TRYING' | 'REHOMING_SUPPORT_NEEDED';
export type HelpfulFactor = 'HOUSING_RESOLUTION' | 'BEHAVIOR_SUPPORT' | 'FINANCIAL_SUPPORT' | 'VETERINARY_SUPPORT' | 'TEMPORARY_CARE' | 'TRUSTED_NETWORK' | 'ROUTINE_CHANGE' | 'OTHER';

export interface CaseResponse {
  id: string;
  petName: string;
  petType: ApiPetType;
  primaryBarrier: ApiBarrier | null;
  urgency: string | null;
  goal: string | null;
  currentStatus: ApiCaseStatus;
  userId: string | null;
  petId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseInput {
  petId: string;
  primaryBarrier?: ApiBarrier | null;
  urgency?: string | null;
  goal?: string | null;
  currentStatus?: ApiCaseStatus;
}

export interface UpdateCaseInput {
  primaryBarrier?: ApiBarrier | null;
  urgency?: string | null;
  goal?: string | null;
  currentStatus?: ApiCaseStatus;
}

export interface PetResponse {
  id: string;
  userId: string;
  name: string;
  type: ApiPetType;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedFactor extends FactorInput { id: string; caseId: string; createdAt: string; }
export interface PersistedOutcome { id: string; caseId: string; status: ApiOutcomeStatus; unresolvedBarrier: string | null; notes: string | null; helpfulFactors?: HelpfulFactor[]; createdAt: string; }
export interface SavedCaseSummary { case: CaseResponse; pet: PetResponse; factors: PersistedFactor[]; latestOutcome: PersistedOutcome | null; activeActionCount?: number; }
export interface SavedCaseDetail { case: CaseResponse; pet: PetResponse | null; factors: PersistedFactor[]; outcomes: PersistedOutcome[]; }

export interface SimilarCase {
  id: string;
  provenance: 'synthetic_example' | 'anonymous_shared_case';
  similarityLabel: 'High similarity' | 'Medium similarity' | 'Similar situation';
  petType: string;
  factors: string[];
  pathKey: string;
  actions: string[];
  outcomeCategory: 'KEEPING_PET' | 'STILL_TRYING' | 'REHOMING_SUPPORT_NEEDED' | 'UNKNOWN';
  reasons: string[];
}

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

export interface EvidenceClaim {
  code: string;
  label: string;
  summary: string;
}

export interface PathEvidenceCard {
  id: string;
  organization: string;
  title: string;
  url: string;
  publicationYear: number | null;
  sourceType: 'research' | 'industry_guidance' | 'industry_data';
  summary: string;
  whyRelevant: string;
  claims: EvidenceClaim[];
}

export interface PathEvidenceResponse {
  caseId: string;
  pathKey: string;
  whyThisApproach: string;
  evidence: PathEvidenceCard[];
}

export type CaseActionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_POSSIBLE';
export type NotPossibleReason = 'COST' | 'NO_AVAILABILITY' | 'NOT_ELIGIBLE' | 'NO_RESPONSE' | 'TIME' | 'TRANSPORTATION' | 'SAFETY' | 'HOUSING' | 'HOUSEHOLD' | 'OTHER';
export interface CaseAction { id: string; caseId: string; pathKey: string; actionKey: string; interventionKey: string | null; relatedFact: string | null; title: string; description: string; status: CaseActionStatus; notPossibleReason: NotPossibleReason | null; resultNote: string | null; outcomeKey: string | null; createdAt: string; updatedAt: string; completedAt: string | null; }
export interface CaseEvent { id: string; caseId: string; actionId: string | null; eventType: string; eventData: Record<string, string | null>; createdAt: string; }
export interface RecommendedAction { key: string; pathKey: string; interventionKey?: string; relatedFact: string; title: string; description: string; outcomes: Array<{ key: string; label: string; factValue?: boolean }>; }
export interface ActionsResponse { actions: CaseAction[]; events: CaseEvent[]; recommended: RecommendedAction[]; }

const explanationCache = new Map<string, Promise<ExplanationResponse>>();

export const clearCaseApiClientCache = () => explanationCache.clear();
export const SAVED_PLANS_CHANGED_EVENT = 'keep-them-home:saved-plans-changed';

let authTokenProvider: (() => Promise<string | null>) | undefined;
export const configureAuthTokenProvider = (provider: (() => Promise<string | null>) | undefined) => {
  authTokenProvider = provider;
};

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const token = await authTokenProvider?.();
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  if (!response.ok) throw new Error(`Case API request failed with status ${response.status}`);
  return response.json() as Promise<T>;
};

export const caseApi = {
  createPet: async (input: { name: string; type: ApiPetType }) =>
    (await requestJson<{ pet: PetResponse }>('/api/pets', { method: 'POST', body: JSON.stringify(input) })).pet,

  listPets: async () => (await requestJson<{ pets: PetResponse[] }>('/api/pets')).pets,

  listCases: async () => (await requestJson<{ cases: SavedCaseSummary[] }>('/api/cases')).cases,

  createCase: async (input: CreateCaseInput) =>
    (await requestJson<{ case: CaseResponse }>('/api/cases', {
      method: 'POST', body: JSON.stringify(input),
    })).case,

  getCase: async (id: string) =>
    requestJson<SavedCaseDetail>(`/api/cases/${id}`),

  updateCase: async (id: string, input: UpdateCaseInput) =>
    (await requestJson<{ case: CaseResponse }>(`/api/cases/${id}`, {
      method: 'PATCH', body: JSON.stringify(input),
    })).case,

  recordFactors: async (id: string, factors: FactorInput[]) =>
    requestJson(`/api/cases/${id}/factors`, {
      method: 'POST', body: JSON.stringify({ factors }),
    }),

  recordOutcome: async (id: string, status: ApiOutcomeStatus, helpfulFactors: HelpfulFactor[] = [], notes?: string | null) =>
    requestJson(`/api/cases/${id}/outcomes`, {
      method: 'POST', body: JSON.stringify({ status, helpfulFactors, notes }),
    }),

  getActions: async (id: string) => requestJson<ActionsResponse>(`/api/cases/${id}/actions`),
  addAction: async (id: string, pathKey: string, actionKey: string) =>
    (await requestJson<{ action: CaseAction }>(`/api/cases/${id}/actions`, { method: 'POST', body: JSON.stringify({ pathKey, actionKey }) })).action,
  updateAction: async (id: string, actionId: string, input: { status: CaseActionStatus; notPossibleReason?: NotPossibleReason | null; resultNote?: string | null }) =>
    (await requestJson<{ action: CaseAction }>(`/api/cases/${id}/actions/${actionId}`, { method: 'PATCH', body: JSON.stringify(input) })).action,
  recordActionOutcome: async (id: string, actionId: string, outcomeKey: string, resultNote?: string | null) =>
    requestJson<{ action: CaseAction; changedFact: { field: string; value: boolean } | null; paths: RetentionPathResult[]; transitions: Array<{ pathKey: string; title: string; from: RetentionPathStatus; to: RetentionPathStatus }> }>(`/api/cases/${id}/actions/${actionId}/outcome`, { method: 'POST', body: JSON.stringify({ outcomeKey, resultNote }) }),

  getSimilarCases: async (id: string) =>
    requestJson<{ cases: SimilarCase[]; disclaimer: string }>(`/api/cases/${id}/similar`),

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

  getPathEvidence: async (id: string, pathKey: string) =>
    requestJson<PathEvidenceResponse>(`/api/cases/${id}/paths/${pathKey}/evidence`),

  previewPathEvidence: async (input: {
    pathKey: string; primaryBarrier: ApiBarrier; situation: string | null; urgency: string | null; goal: string | null;
    behaviorContributor: boolean; costConstraint: string | null; contributingBarriers: ApiBarrier[];
  }) => requestJson<PathEvidenceResponse>('/api/evidence/preview', { method: 'POST', body: JSON.stringify(input) }),

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
