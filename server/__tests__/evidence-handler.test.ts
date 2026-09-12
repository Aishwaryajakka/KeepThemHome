import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createEvidenceHandler } from '../api-handlers/cases/[id]/paths/[pathKey]/evidence.js';
import { getCasePathEvidence } from '../services/evidence-service.js';
import type { NormalizedHousingCase, PathEvaluation } from '../retention-paths/domain.js';

const caseId = '550e8400-e29b-41d4-a716-446655440000';
const owned = vi.fn(async () => ({ status: 'ok' as const, user: { id: 'user-a' }, caseRecord: { id: caseId } } as never));
const responseDouble = () => {
  const json = vi.fn();
  const response = { setHeader: vi.fn(), status: vi.fn(() => response), json } as unknown as VercelResponse;
  return { response, json };
};

describe('GET /api/cases/:id/paths/:pathKey/evidence', () => {
  it('validates the persisted-case identifier and trusted path key', async () => {
    const getEvidence = vi.fn();
    const handler = createEvidenceHandler(getEvidence, owned);
    const invalidId = responseDouble();
    await handler({ method: 'GET', query: { id: 'bad', pathKey: 'move_with_pet' } } as unknown as VercelRequest, invalidId.response);
    expect(invalidId.response.status).toHaveBeenCalledWith(400);
    const invalidPath = responseDouble();
    await handler({ method: 'GET', query: { id: caseId, pathKey: 'invented' } } as unknown as VercelRequest, invalidPath.response);
    expect(invalidPath.response.status).toHaveBeenCalledWith(400);
    expect(getEvidence).not.toHaveBeenCalled();
  });

  it('selects evidence from server-loaded facts and server-recomputed interventions', async () => {
    const facts: NormalizedHousingCase = {
      primaryBarrier: 'housing', situation: null, urgency: null, goal: null, costConstraint: null,
      constraints: {
        goalSupportsStay: 'unknown', goalSupportsMove: 'unknown', housingResolutionPossible: 'unknown',
        behaviorContributor: false, behaviorMitigationAvailable: 'unknown', temporaryCareAvailable: 'unknown',
        underlyingIssueResolutionPossible: 'unknown', petFriendlyHousingAvailable: 'unknown', moveRequirementsMet: 'unknown',
      },
    };
    const trustedPath: PathEvaluation = {
      key: 'move_with_pet', title: 'Move', objective: 'Move together.', status: 'CONDITIONAL',
      statusReason: 'Unknown requirements.', blockers: [], reasonCodes: [], rankScore: 100, friction: 3,
      steps: [{ key: 'search', title: 'Search', description: 'Search safely.', interventionKey: 'search_pet_friendly_housing' }],
    };
    const generatePaths = vi.fn().mockResolvedValue({ caseId, paths: [trustedPath] });
    const loadFacts = vi.fn().mockResolvedValue(facts);
    const result = await getCasePathEvidence(caseId, 'move_with_pet', [], { generatePaths, loadFacts });
    expect(generatePaths).toHaveBeenCalledWith(caseId, []);
    expect(loadFacts).toHaveBeenCalledWith(caseId);
    expect(result?.evidence[0].claims.map(({ code }) => code)).toContain('PET_FRIENDLY_HOUSING_BARRIER');
    expect(trustedPath.status).toBe('CONDITIONAL');
  });

  it('does not accept browser-supplied claims, URLs, or hypothetical state', async () => {
    const result = { caseId, pathKey: 'remain_in_current_housing', whyThisApproach: 'Housing matters.', evidence: [] };
    const getEvidence = vi.fn().mockResolvedValue(result);
    const { response, json } = responseDouble();
    await createEvidenceHandler(getEvidence, owned)({
      method: 'GET', query: { id: caseId, pathKey: 'remain_in_current_housing' },
      body: { claim: 'THIS_WILL_WORK', url: 'https://attacker.example', appliedChanges: ['INVENTED'] },
    } as unknown as VercelRequest, response);
    expect(getEvidence).toHaveBeenCalledWith(caseId, 'remain_in_current_housing', []);
    expect(json).toHaveBeenCalledWith(result);
  });

  it('rejects unsupported methods and returns 404 for a missing persisted case', async () => {
    const handler = createEvidenceHandler(vi.fn().mockResolvedValue(undefined), owned);
    const method = responseDouble();
    await handler({ method: 'POST', query: { id: caseId, pathKey: 'move_with_pet' } } as unknown as VercelRequest, method.response);
    expect(method.response.status).toHaveBeenCalledWith(405);
    const missing = responseDouble();
    await handler({ method: 'GET', query: { id: caseId, pathKey: 'move_with_pet' } } as unknown as VercelRequest, missing.response);
    expect(missing.response.status).toHaveBeenCalledWith(404);
  });

  it('does not expose case-aware evidence for a foreign case', async () => {
    const getEvidence = vi.fn();
    const { response } = responseDouble();
    await createEvidenceHandler(getEvidence, vi.fn(async () => ({ status: 'not_found' as const })))({
      method: 'GET', query: { id: caseId, pathKey: 'move_with_pet' },
    } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(getEvidence).not.toHaveBeenCalled();
  });
});
