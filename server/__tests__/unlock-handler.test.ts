import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createUnlockHandler } from '../../api/cases/[id]/paths/[pathKey]/unlock';

const caseId = '550e8400-e29b-41d4-a716-446655440000';
const owned = vi.fn(async () => ({ status: 'ok' as const, user: { id: 'user-a' }, caseRecord: { id: caseId } } as never));
const responseDouble = () => {
  const json = vi.fn();
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(() => response),
    json,
  } as unknown as VercelResponse;
  return { response, json };
};
const request = (overrides: Record<string, unknown> = {}) => ({
  method: 'POST',
  query: { id: caseId, pathKey: 'move_with_pet' },
  body: {},
  ...overrides,
}) as unknown as VercelRequest;

describe('Smallest Unlock API handler', () => {
  it('validates method, UUID, and target path', async () => {
    const handler = createUnlockHandler(vi.fn(), owned);
    for (const [input, expected] of [
      [request({ method: 'GET' }), 405],
      [request({ query: { id: 'bad', pathKey: 'move_with_pet' } }), 400],
      [request({ query: { id: caseId, pathKey: 'invented' } }), 400],
    ] as const) {
      const { response } = responseDouble();
      await handler(input, response);
      expect(response.status).toHaveBeenCalledWith(expected);
    }
  });

  it('rejects arbitrary hypothetical fields and change codes', async () => {
    const handler = createUnlockHandler(vi.fn(), owned);
    const { response } = responseDouble();
    await handler(request({ body: { appliedChanges: ['MAKE_IT_WORK'], arbitraryField: true } }), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 for a missing case', async () => {
    const handler = createUnlockHandler(vi.fn().mockResolvedValue(undefined), owned);
    const { response } = responseDouble();
    await handler(request(), response);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it('returns a structured unlock result without accepting solver state from the browser', async () => {
    const result = {
      targetPathKey: 'move_with_pet', unlockNeeded: true, currentStatus: 'BLOCKED',
      currentBlockers: [], smallestUnlock: null, alternatives: [], appliedChanges: [],
      appliedOverrides: {}, currentPathEvaluation: {},
    } as never;
    const generator = vi.fn().mockResolvedValue(result);
    const handler = createUnlockHandler(generator, owned);
    const { response, json } = responseDouble();
    await handler(request({ body: { appliedChanges: ['ALLOW_STAY_OR_MOVE'] } }), response);
    expect(generator).toHaveBeenCalledWith(caseId, 'move_with_pet', ['ALLOW_STAY_OR_MOVE']);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(result);
  });

  it('sanitizes service failures', async () => {
    const handler = createUnlockHandler(vi.fn().mockRejectedValue(new Error('secret')), owned);
    const { response, json } = responseDouble();
    await handler(request(), response);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Unable to complete the request' });
  });

  it('does not run a counterfactual for a foreign case', async () => {
    const generator = vi.fn();
    const authorize = vi.fn(async () => ({ status: 'not_found' as const }));
    const { response } = responseDouble();
    await createUnlockHandler(generator, authorize)(request(), response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(generator).not.toHaveBeenCalled();
  });
});
