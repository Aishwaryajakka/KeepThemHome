import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { canonicalSimilarityText, structuredEmbedding } from '../similarity/canonical.js';
import { qualitativeSimilarity, similarityScore } from '../similarity/rank.js';
import type { SimilarCaseDto, StructuredSimilarityInput } from '../similarity/domain.js';
import { isSimilarityCandidate } from '../services/similarity-service.js';
import { createSimilarCasesHandler } from '../api-handlers/cases/[id]/similar.js';

const source: StructuredSimilarityInput = { petType: 'dog', primaryFactor: 'housing', contributingFactors: ['behavior', 'cost'], urgencyBucket: 'within_week', constraintKeys: ['housingResolutionPossible'], pathKey: 'remain_in_current_housing', blockerCategories: ['housing', 'behavior', 'cost'], interventionCategories: ['clarify_housing_restriction'], outcomeCategory: 'STILL_TRYING' };
const caseId = '550e8400-e29b-41d4-a716-446655440000';
const responseDouble = () => { const json = vi.fn(); const response = { status: vi.fn(() => response), json, setHeader: vi.fn() } as unknown as VercelResponse; return { response, json }; };

describe('privacy-safe similarity', () => {
  it('canonicalizes only controlled structured fields and excludes PII and narrative', () => {
    const canonical = canonicalSimilarityText({ ...source, rawStory: 'My landlord Jane at 312-555-0199', email: 'owner@example.com', name: 'Luna', contributingFactors: ['behavior', 'owner@example.com'] } as StructuredSimilarityInput);
    expect(canonical).toContain('primary_factor:housing');
    expect(canonical).not.toMatch(/Jane|555|owner@|Luna|landlord/i);
    expect(structuredEmbedding(source)).toHaveLength(32);
  });

  it('ranks multi-factor overlap above a single-factor case and labels deterministically', () => {
    const multi = { ...source, outcomeCategory: 'KEEPING_PET' as const };
    const single = { ...source, contributingFactors: [], blockerCategories: ['housing'], constraintKeys: [], pathKey: 'move_with_pet', interventionCategories: [] };
    expect(similarityScore(source, multi)).toBeGreaterThan(similarityScore(source, single));
    expect(qualitativeSimilarity(similarityScore(source, multi))).toBe('High similarity');
    expect(qualitativeSimilarity(0)).toBe('Similar situation');
  });

  it('excludes the source and sharing-ineligible real cases while including synthetic cases', () => {
    expect(isSimilarityCandidate('same', { id: 'same', isSynthetic: true, sharingEligible: true })).toBe(false);
    expect(isSimilarityCandidate('source', { id: 'private', isSynthetic: false, sharingEligible: false })).toBe(false);
    expect(isSimilarityCandidate('source', { id: 'synthetic', isSynthetic: true, sharingEligible: true })).toBe(true);
  });

  it('enforces source ownership and returns a sanitized DTO', async () => {
    const dto: SimilarCaseDto = { id: 'profile-1', provenance: 'synthetic_example', similarityLabel: 'High similarity', petType: 'dog', factors: ['housing', 'behavior'], pathKey: 'remain_in_current_housing', actions: ['clarify_housing_restriction'], outcomeCategory: 'KEEPING_PET', reasons: ['housing', 'behavior'] };
    const search = vi.fn().mockResolvedValue([dto]);
    const handler = createSimilarCasesHandler(vi.fn().mockResolvedValue({ status: 'ok', user: {}, caseRecord: {} }) as never, search);
    const { response, json } = responseDouble();
    await handler({ method: 'GET', query: { id: caseId } } as unknown as VercelRequest, response);
    const payload = json.mock.calls[0][0];
    expect(payload.cases).toEqual([dto]);
    expect(JSON.stringify(payload)).not.toMatch(/userId|authSubject|email|rawStory|notes|address/i);
  });

  it.each([['unauthenticated', 401], ['not_found', 404]] as const)('returns %s ownership result as %i', async (status, expected) => {
    const authorize = vi.fn().mockResolvedValue({ status }); const { response } = responseDouble();
    await createSimilarCasesHandler(authorize as never, vi.fn())({ method: 'GET', query: { id: caseId } } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(expected);
  });
});
