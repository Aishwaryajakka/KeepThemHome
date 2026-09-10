import { describe, expect, it } from 'vitest';
import { evidenceCatalog, evidenceSourceSchema } from '../evidence/catalog';
import { interventionClaims, selectEvidenceForPath } from '../evidence/select';
import type { NormalizedHousingCase, PathEvaluation, PathStatus } from '../retention-paths/domain';

const caseId = '550e8400-e29b-41d4-a716-446655440000';
const luna: NormalizedHousingCase = {
  primaryBarrier: 'housing',
  situation: 'My landlord or property says pets aren’t allowed',
  urgency: 'This week',
  goal: 'Stay where I am',
  costConstraint: 'Cannot afford behavior help',
  constraints: {
    goalSupportsStay: true, goalSupportsMove: false, housingResolutionPossible: 'unknown',
    behaviorContributor: true, behaviorMitigationAvailable: 'unknown', temporaryCareAvailable: 'unknown',
    underlyingIssueResolutionPossible: 'unknown', petFriendlyHousingAvailable: 'unknown', moveRequirementsMet: 'unknown',
  },
};

const path = (key = 'remain_in_current_housing', status: PathStatus = 'CONDITIONAL'): PathEvaluation => ({
  key,
  title: key === 'move_with_pet' ? 'Move with your pet' : 'Stay in current housing with your pet',
  objective: 'Keep the pet and owner housed together.',
  status,
  statusReason: 'Trusted solver result.',
  steps: [{
    key: key === 'move_with_pet' ? 'find_pet_friendly_housing' : 'clarify_complaint',
    title: 'Trusted step', description: 'Trusted description.',
    interventionKey: key === 'move_with_pet' ? 'search_pet_friendly_housing' : 'clarify_housing_restriction',
  }],
  blockers: [], reasonCodes: ['HOUSING_BARRIER'], rankScore: 200, friction: 1,
});

describe('curated evidence catalog', () => {
  it('contains six unique, valid, canonical HTTPS sources', () => {
    expect(evidenceCatalog).toHaveLength(6);
    expect(new Set(evidenceCatalog.map(({ id }) => id)).size).toBe(6);
    for (const source of evidenceCatalog) {
      expect(evidenceSourceSchema.safeParse(source).success).toBe(true);
      expect(source.url).toMatch(/^https:\/\/(www\.)?(aspca\.org|humananimalsupportservices\.org|bestfriends\.org)\//);
    }
  });

  it('rejects invalid records and unsafe source URLs', () => {
    expect(evidenceSourceSchema.safeParse({ ...evidenceCatalog[0], id: 'Not Stable' }).success).toBe(false);
    expect(evidenceSourceSchema.safeParse({ ...evidenceCatalog[0], url: 'javascript:alert(1)' }).success).toBe(false);
    expect(evidenceSourceSchema.safeParse({ ...evidenceCatalog[0], supportsClaims: ['INVENTED'] }).success).toBe(false);
  });

  it('keeps intervention claim mapping deterministic and inspectable', () => {
    expect(interventionClaims.clarify_housing_restriction).toEqual([
      'LANDLORD_HOUSING_BARRIER', 'HOUSING_SURRENDER_DRIVER',
    ]);
    expect(interventionClaims.search_pet_friendly_housing).toContain('PET_FRIENDLY_HOUSING_BARRIER');
  });
});

describe('case-aware evidence selection', () => {
  it('gives multi-factor Luna housing, behavior, cost/access, and multi-factor claims', () => {
    const result = selectEvidenceForPath(caseId, path(), luna);
    const claims = result.evidence.flatMap((source) => source.claims.map(({ code }) => code));
    expect(claims).toEqual(expect.arrayContaining([
      'HOUSING_SURRENDER_DRIVER', 'LANDLORD_HOUSING_BARRIER', 'BEHAVIOR_SURRENDER_DRIVER',
      'BEHAVIOR_HELP_ACCESS', 'FINANCIAL_SURRENDER_DRIVER', 'MULTI_FACTOR_SURRENDER',
    ]));
    expect(claims).not.toContain('VETERINARY_COST_SUPPORT');
    expect(result.whyThisApproach).toBe('Housing, Behavior, Cost are all affecting this case.');
  });

  it('uses stable ordering, deduplicates sources, and emphasizes pet-friendly housing on Move', () => {
    const first = selectEvidenceForPath(caseId, path('move_with_pet', 'BLOCKED'), luna);
    const second = selectEvidenceForPath(caseId, path('move_with_pet', 'BLOCKED'), luna);
    expect(second).toEqual(first);
    expect(new Set(first.evidence.map(({ id }) => id)).size).toBe(first.evidence.length);
    expect(first.evidence[0].claims.map(({ code }) => code)).toContain('PET_FRIENDLY_HOUSING_BARRIER');
  });

  it.each(['FEASIBLE', 'CONDITIONAL', 'BLOCKED'] as const)('cannot modify a %s solver result', (status) => {
    const trustedPath = path('remain_in_current_housing', status);
    const before = structuredClone(trustedPath);
    selectEvidenceForPath(caseId, trustedPath, luna);
    expect(trustedPath).toEqual(before);
    expect(trustedPath.status).toBe(status);
  });

  it('excludes behavior, cost, and veterinary evidence when those factors are absent', () => {
    const housingOnly = structuredClone(luna);
    housingOnly.costConstraint = null;
    housingOnly.constraints.behaviorContributor = false;
    const claims = selectEvidenceForPath(caseId, path(), housingOnly).evidence
      .flatMap((source) => source.claims.map(({ code }) => code));
    expect(claims).not.toEqual(expect.arrayContaining([
      'BEHAVIOR_SURRENDER_DRIVER', 'BEHAVIOR_HELP_ACCESS', 'FINANCIAL_SURRENDER_DRIVER', 'VETERINARY_COST_SUPPORT',
    ]));
  });

  it.each([
    ['behavior', 'BEHAVIOR_SURRENDER_DRIVER'],
    ['cost', 'FINANCIAL_SURRENDER_DRIVER'],
    ['medical', 'VETERINARY_COST_SUPPORT'],
  ] as const)('maps a %s case factor only to its supported evidence area', (factor, expectedClaim) => {
    const factorCase = structuredClone(luna);
    factorCase.primaryBarrier = factor;
    factorCase.contributingBarriers = [];
    factorCase.costConstraint = factor === 'cost' ? 'General financial constraint' : null;
    factorCase.constraints.behaviorContributor = factor === 'behavior';
    const claims = selectEvidenceForPath(caseId, path(), factorCase).evidence
      .flatMap((source) => source.claims.map(({ code }) => code));
    expect(claims).toContain(expectedClaim);
  });
});
