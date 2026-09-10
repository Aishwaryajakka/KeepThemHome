export type ApiPetType = 'dog' | 'cat' | 'other';
export type ApiBarrier = 'housing' | 'behavior' | 'cost' | 'medical' | 'circumstances';
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
  paths: RetentionPathResult[];
}

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

  getRetentionPaths: async (id: string) =>
    requestJson<RetentionPathsResponse>(`/api/cases/${id}/paths`, { method: 'POST' }),
};
