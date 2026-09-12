import { describe, expect, it, vi } from 'vitest';
import { exploreSmallestUnlock } from '../counterfactual/engine.js';
import type { GroundedExplanationPayload } from '../explanation/domain.js';
import { deterministicExplanation } from '../explanation/fallback.js';
import { isGroundedExplanation } from '../explanation/grounding.js';
import { generateGroundedExplanation } from '../explanation/groq.js';
import { ExtractionFailedError, ProviderUnavailableError } from '../intake/groq.js';
import { normalizeHousingCase } from '../retention-paths/normalize.js';
import { solveRetentionPaths } from '../retention-paths/solver.js';
import {
  buildGroundedExplanationPayload,
  explainCasePath,
  type ExplanationDependencies,
} from '../services/explanation-service.js';
import { explanationOutputSchema } from '../validation/explanation.js';

const lunaFacts = normalizeHousingCase(
  { primaryBarrier: 'housing', urgency: 'This week', goal: 'Stay where I am' },
  [
    { factorType: 'housing_situation', factorValue: 'My landlord or property says pets aren’t allowed' },
    { factorType: 'behavior_contributor', factorValue: 'behavior' },
    { factorType: 'behavior_concern', factorValue: 'Barking or excessive noise' },
    { factorType: 'cost_constraint', factorValue: 'Cannot afford a professional trainer' },
  ],
);
const lunaMove = solveRetentionPaths(lunaFacts).find(({ key }) => key === 'move_with_pet')!;
const lunaUnlock = exploreSmallestUnlock(lunaFacts, 'move_with_pet')!;

const payload = (overrides: Partial<GroundedExplanationPayload> = {}): GroundedExplanationPayload => ({
  pet: { name: 'Luna', type: 'dog' }, ownerGoal: 'Stay where I am', mode: 'BLOCKER_EXPLANATION',
  selectedPath: { ...lunaMove, rank: 3, orderedSteps: lunaMove.steps.map(({ title, description }) => ({ title, description })) },
  smallestUnlock: {
    changes: lunaUnlock.smallestUnlock!.changes,
    resultingStatus: lunaUnlock.smallestUnlock!.resultingStatus,
  },
  appliedChanges: [],
  resources: [{
    name: 'Approved Housing Directory', description: 'A directory to investigate.',
    url: 'https://approved.example/housing', relevantStep: 'Search for pet-friendly housing',
  }],
  safetyState: 'NOT_ACTIVE', isHypothetical: false, ...overrides,
});

describe('grounded explanation', () => {
  it.each(['FEASIBLE', 'CONDITIONAL', 'BLOCKED'] as const)('provides a deterministic %s fallback', (status) => {
    const result = deterministicExplanation(payload({ selectedPath: { ...payload().selectedPath, status } }));
    expect(result.status).toBe(status);
    if (status === 'FEASIBLE') expect(result.summary).toContain('does not guarantee');
    if (status === 'CONDITIONAL') expect(result.summary).toContain('Unknown conditions are not treated as available');
    if (status === 'BLOCKED') expect(result.summary).toContain('blocked');
  });

  it('preserves the exact computed Smallest Unlock in hypothetical language', () => {
    const result = deterministicExplanation(payload());
    for (const change of lunaUnlock.smallestUnlock!.changes) expect(result.nextStep).toContain(change.label);
    expect(result.nextStep).toContain('hypothetical');
  });

  it('distinguishes applied what-if assumptions from actual facts', () => {
    const result = deterministicExplanation(payload({ isHypothetical: true }));
    expect(result.summary).toContain('what-if scenario');
    expect(result.isHypothetical).toBe(true);
  });

  it('rejects unsupported output shapes, status changes, resource names, and URLs', () => {
    const valid = {
      status: 'BLOCKED' as const, isHypothetical: false, headline: 'Move is blocked',
      summary: 'This path is blocked by the supplied goal.', why: 'Some conditions remain unknown.',
      nextStep: 'Use the computed unlock as a what-if.', resourceNames: ['Approved Housing Directory'],
    };
    expect(explanationOutputSchema.safeParse({ ...valid, extra: true }).success).toBe(false);
    expect(isGroundedExplanation(valid, payload())).toBe(true);
    expect(isGroundedExplanation({ ...valid, status: 'FEASIBLE' }, payload())).toBe(false);
    expect(isGroundedExplanation({ ...valid, resourceNames: ['Invented Grant'] }, payload())).toBe(false);
    expect(isGroundedExplanation({ ...valid, nextStep: 'Visit https://invented.example' }, payload())).toBe(false);
    expect(isGroundedExplanation({ ...valid, isHypothetical: true, nextStep: 'These facts are confirmed.' }, payload({ isHypothetical: true }))).toBe(false);
    expect(isGroundedExplanation({ ...valid, isHypothetical: true, nextStep: 'In this what-if scenario, these are assumptions.' }, payload({ isHypothetical: true }))).toBe(true);
  });

  it('validates successful Groq structured output and rejects malformed or ungrounded output', async () => {
    const output = {
      status: 'BLOCKED', isHypothetical: false, headline: 'Move is currently blocked',
      summary: 'The stated goal conflicts with moving.', why: 'Housing and move requirements remain unknown.',
      nextStep: 'The supplied three-change unlock is hypothetical.', resourceNames: [],
    };
    const successFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(output) } }] }), { status: 200 }));
    await expect(generateGroundedExplanation(payload(), { fetch: successFetch, apiKey: 'key', model: 'model' })).resolves.toEqual(output);
    expect(JSON.parse(successFetch.mock.calls[0][1]?.body as string).response_format.json_schema.strict).toBe(true);

    const malformedFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), { status: 200 }));
    await expect(generateGroundedExplanation(payload(), { fetch: malformedFetch, apiKey: 'key', model: 'model' })).rejects.toBeInstanceOf(ExtractionFailedError);

    const changedStatus = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...output, status: 'FEASIBLE' }) } }] }), { status: 200 }));
    await expect(generateGroundedExplanation(payload(), { fetch: changedStatus, apiKey: 'key', model: 'model' })).rejects.toBeInstanceOf(ExtractionFailedError);
  });

  it('handles missing configuration and provider failure without retries', async () => {
    await expect(generateGroundedExplanation(payload(), { apiKey: '', model: '' })).rejects.toBeInstanceOf(ProviderUnavailableError);
    const failedFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 503 }));
    await expect(generateGroundedExplanation(payload(), { fetch: failedFetch, apiKey: 'key', model: 'model' })).rejects.toBeInstanceOf(ExtractionFailedError);
    expect(failedFetch).toHaveBeenCalledTimes(1);
  });
});

describe('trusted payload construction', () => {
  const date = new Date('2026-09-10T00:00:00Z');
  const pathWithResources = {
    ...lunaMove,
    steps: lunaMove.steps.map((step, index) => ({
      ...step,
      resources: index === 0 ? [{
        id: 'resource', slug: 'approved', name: 'Approved Housing Directory', category: 'housing-search',
        description: 'A directory to investigate.', geographicScope: 'National', eligibilitySummary: 'Verify directly',
        costSummary: 'Varies', url: 'https://approved.example/housing', sourceName: 'Source', verifiedAt: '2026-09-01',
        verificationStatus: 'verified', tags: [], active: true, createdAt: date, updatedAt: date,
      }] : [],
    })),
  };
  const dependencies = {
    loadCase: vi.fn().mockResolvedValue({
      id: 'case', petName: 'Luna', petType: 'dog', primaryBarrier: 'housing', urgency: 'This week',
      goal: 'Stay where I am', currentStatus: 'active', createdAt: date, updatedAt: date,
    }),
    loadFactors: vi.fn().mockResolvedValue([{ factorType: 'behavior_concern', factorValue: 'Barking or excessive noise' }]),
    generatePaths: vi.fn().mockResolvedValue({
      caseId: 'case', facts: { primaryBarrier: 'housing', situation: lunaFacts.situation, urgency: 'This week', goal: 'Stay where I am', behaviorContributor: true, costConstraint: lunaFacts.costConstraint },
      appliedChanges: [], paths: [pathWithResources],
    }),
    generateUnlock: vi.fn().mockResolvedValue(lunaUnlock),
    generateExplanation: vi.fn().mockRejectedValue(new Error('provider unavailable')),
  } as unknown as ExplanationDependencies;

  it('constructs a minimal payload from server-recomputed state and approved resources', async () => {
    const result = await buildGroundedExplanationPayload('case', 'move_with_pet', 'PATH_SUMMARY', [], dependencies);
    expect(result).toMatchObject({
      pet: { name: 'Luna', type: 'dog' }, ownerGoal: 'Stay where I am',
      selectedPath: { key: 'move_with_pet', status: 'BLOCKED', rank: 1 },
      resources: [{ name: 'Approved Housing Directory', url: 'https://approved.example/housing' }],
      isHypothetical: false,
    });
    expect(dependencies.generatePaths).toHaveBeenCalledWith('case', []);
    expect(dependencies.generateUnlock).toHaveBeenCalledWith('case', 'move_with_pet', []);
  });

  it('falls back deterministically when Groq fails', async () => {
    const result = await explainCasePath('case', 'move_with_pet', 'PATH_SUMMARY', [], dependencies);
    expect(result?.source).toBe('deterministic');
    expect(result?.explanation.status).toBe('BLOCKED');
  });
});
