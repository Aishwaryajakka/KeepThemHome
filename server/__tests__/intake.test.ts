import { describe, expect, it, vi } from 'vitest';
import { extractIntake, ExtractionFailedError, ProviderUnavailableError } from '../intake/groq.js';
import { selectIntakeFollowUps } from '../intake/follow-ups.js';
import { intakeExtractionSchema, intakeRequestSchema, type IntakeExtraction } from '../validation/intake.js';

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
      { field: 'goal', screen: 'housing-3', question: 'Would you prefer to stay where you are or move?' },
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
    expect(body.response_format.json_schema.schema.properties.contributingBarriers).not.toHaveProperty('uniqueItems');
  });

  it('accepts a valid structured response wrapped in a markdown JSON fence', async () => {
    const providerFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(lunaExtraction)}\n\`\`\`` } }],
    }), { status: 200 }));
    await expect(extractIntake('story', { fetch: providerFetch, apiKey: 'key', model: 'model' })).resolves.toEqual(lunaExtraction);
  });

  it('accepts harmless text surrounding a valid JSON object', async () => {
    const providerFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: `Result follows:\n${JSON.stringify(lunaExtraction)}\nDone.` } }],
    }), { status: 200 }));
    await expect(extractIntake('story', { fetch: providerFetch, apiKey: 'key', model: 'model' })).resolves.toEqual(lunaExtraction);
  });

  it('distinguishes malformed JSON from schema validation and does not retry either', async () => {
    const invalidJsonFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{bad' } }] }), { status: 200 }));
    await expect(extractIntake('story', { fetch: invalidJsonFetch, apiKey: 'key', model: 'model' })).rejects.toMatchObject({ category: 'json_parse' });
    expect(invalidJsonFetch).toHaveBeenCalledTimes(1);
    const malformedFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), { status: 200 }));
    await expect(extractIntake('story', { fetch: malformedFetch, apiKey: 'key', model: 'model' })).rejects.toMatchObject({ category: 'schema_validation' });
    expect(malformedFetch).toHaveBeenCalledTimes(1);
  });

  it.each([[401, 'authentication'], [400, 'invalid_request'], [404, 'invalid_model']] as const)('does not retry provider HTTP %s', async (status, category) => {
    const providerFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: category } }), { status }));
    await expect(extractIntake('story', { fetch: providerFetch, apiKey: 'key', model: 'model' })).rejects.toMatchObject({ category, providerStatus: status });
    expect(providerFetch).toHaveBeenCalledTimes(1);
  });

  it.each([[429, 'rate_limit'], [500, 'upstream_5xx']] as const)('retries provider HTTP %s once, then reports %s', async (status, category) => {
    const providerFetch = vi.fn().mockResolvedValue(new Response('{}', { status }));
    await expect(extractIntake('story', { fetch: providerFetch, apiKey: 'key', model: 'model', sleep: async () => undefined })).rejects.toMatchObject({ category, providerStatus: status });
    expect(providerFetch).toHaveBeenCalledTimes(2);
  });

  it('retries a transient failure once and succeeds', async () => {
    const providerFetch = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(lunaExtraction) } }] }), { status: 200 }));
    await expect(extractIntake('story', { fetch: providerFetch, apiKey: 'key', model: 'model', sleep: async () => undefined })).resolves.toEqual(lunaExtraction);
    expect(providerFetch).toHaveBeenCalledTimes(2);
  });

  it('times out, retries once, and reports timeout', async () => {
    const providerFetch = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    await expect(extractIntake('story', { fetch: providerFetch as typeof fetch, apiKey: 'key', model: 'model', timeoutMs: 1, sleep: async () => undefined })).rejects.toMatchObject({ category: 'timeout' });
    expect(providerFetch).toHaveBeenCalledTimes(2);
  });

  it('distinguishes missing API key and model without making a request', async () => {
    await expect(extractIntake('story', { apiKey: '', model: 'model' })).rejects.toMatchObject({ category: 'missing_api_key' });
    await expect(extractIntake('story', { apiKey: 'key', model: '' })).rejects.toMatchObject({ category: 'missing_model' });
  });

  it('never logs the API key or owner story', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const providerFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
    await expect(extractIntake('private owner story', { fetch: providerFetch, apiKey: 'super-secret-key', model: 'model', requestId: 'safe-id' })).rejects.toBeInstanceOf(ExtractionFailedError);
    const logs = [...error.mock.calls, ...info.mock.calls].flat().join(' ');
    expect(logs).not.toContain('super-secret-key');
    expect(logs).not.toContain('private owner story');
  });
});
