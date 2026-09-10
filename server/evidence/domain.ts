export const evidenceClaimCodes = [
  'MULTI_FACTOR_SURRENDER',
  'HOUSING_SURRENDER_DRIVER',
  'LANDLORD_HOUSING_BARRIER',
  'PET_FRIENDLY_HOUSING_BARRIER',
  'FINANCIAL_SURRENDER_DRIVER',
  'BEHAVIOR_SURRENDER_DRIVER',
  'BEHAVIOR_HELP_ACCESS',
  'TEMPORARY_CARE_SUPPORT',
  'VETERINARY_COST_SUPPORT',
] as const;

export type EvidenceClaimCode = typeof evidenceClaimCodes[number];

export interface EvidenceClaim {
  code: EvidenceClaimCode;
  label: string;
  summary: string;
}

export interface EvidenceSource {
  id: string;
  organization: string;
  title: string;
  url: string;
  publicationYear: number | null;
  sourceType: 'research' | 'industry_guidance' | 'industry_data';
  summary: string;
  supportsClaims: EvidenceClaimCode[];
  tags: string[];
  priority: number;
  active: boolean;
}

export interface PathEvidenceCard {
  id: string;
  organization: string;
  title: string;
  url: string;
  publicationYear: number | null;
  sourceType: EvidenceSource['sourceType'];
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
