import { describe, expect, it, vi } from 'vitest';
import { extractIntake, ExtractionFailedError, ProviderUnavailableError } from '../intake/groq';
import { selectIntakeFollowUps } from '../intake/follow-ups';
import { intakeExtractionSchema, intakeRequestSchema, type IntakeExtraction } from '../validation/intake';

export const lunaExtraction: IntakeExtraction = {
  petName: 'Luna',
  petType: null,
  primaryBarrier: 'housing',
  contributingBarriers: ['behavior', 'cost'],
  housingSituation: 'My landlord or property says pets aren’t allowed',
  behaviorConcern: 'Barking or excessive noise',
  behaviorSeriousness: null,
  behaviorAlreadyTried: null,
  behaviorHelpBarrier: 'Cost',
  costConstraint: 'Cannot afford a trainer',
  urgency: 'This week',
  goal: null,
};

describe('natural-language intake validation', () => {
  it('rejects empty, oversized, extra, and unsupported data', () => {
    expect(intakeRequestSchema.safeParse({ text: ' ' }).success).toBe(false);
    expect(intakeRequestSchema.safeParse({ text: 'a'.repeat(3001) }).success).toBe(false);
    expect(intakeRequestSchema.safeParse({ text: 'valid', extra: true }).success).toBe(false);
    expect(intakeExtractionSchema.safeParse({ ...lunaExtraction, goal: 'Probably stay' }).success).toBe(false);
  });

  it('preserves unknown facts and multi-barrier semantics', () => {
    const parsed = intakeExtractionSchema.parse(lunaExtraction);
    expect(parsed.petType).toBeNull();
    expect(parsed.goal).toBeNull();
    expect(parsed.primaryBarrier).toBe('housing');
    expect(parsed.contributingBarriers).toEqual(['behavior', 'cost']);
  });

  it('rejects invalid factor combinations and duplicates', () => {
    expect(intakeExtractionSchema.safeParse({ ...lunaExtraction, contributingBarriers: ['behavior', 'behavior'] }).success).toBe(false);
    expect(intakeExtractionSchema.safeParse({ ...lunaExtraction, primaryBarrier: 'behavior' }).success).toBe(false);
    expect(intakeExtractionSchema.safeParse({ ...lunaExtraction, contributingBarriers: [], behaviorConcern: 'Barking or excessive noise' }).success).toBe(false);
  });

  it('chooses supported follow-ups deterministically and keeps the count small', () => {
    expect(selectIntakeFollowUps(lunaExtraction)).toEqual([
      { field: 'pet', screen: 'pet-info', question: 'Who are we helping?' },
      { field: 'behaviorSeriousness', screen: 'behavior-2', question: 'How serious does the situation feel?' },
      { field: 'behaviorAlreadyTried', screen: 'behavior-3', question: 'What have you already tried?' },
    ]);
  });
});

describe('Groq extraction boundary', () => {
  it('fails gracefully when provider configuration is missing', async () => {
    await expect(extractIntake('story', { apiKey: '', model: '' })).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('returns a Zod-validated strict extraction', async () => {
    const providerFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(lunaExtraction) } }],
    }), { status: 200 }));
    await expect(extractIntake('story', { fetch: providerFetch, apiKey: 'test-key', model: 'test-model' })).resolves.toEqual(lunaExtraction);
    const body = JSON.parse(providerFetch.mock.calls[0][1]?.body as string);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.additionalProperties).toBe(false);
  });

  it('sanitizes malformed and failed provider responses without retrying', async () => {
    const malformedFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), { status: 200 }));
    await expect(extractIntake('story', { fetch: malformedFetch, apiKey: 'key', model: 'model' })).rejects.toBeInstanceOf(ExtractionFailedError);
    expect(malformedFetch).toHaveBeenCalledTimes(1);

    const failedFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 429 }));
    await expect(extractIntake('story', { fetch: failedFetch, apiKey: 'key', model: 'model' })).rejects.toBeInstanceOf(ExtractionFailedError);
    expect(failedFetch).toHaveBeenCalledTimes(1);
  });
});
