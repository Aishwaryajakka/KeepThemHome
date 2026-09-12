import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createSaveCaseHandler } from '../api-handlers/cases/save.js';

const user = { id: '750e8400-e29b-41d4-a716-446655440000' };
const payload = {
  pet: { name: 'Luna', type: 'dog' },
  case: { primaryBarrier: 'housing', urgency: 'This week', goal: 'Stay where I am', currentStatus: 'ACTIVE' },
  factors: [{ factorType: 'primary_barrier', factorValue: 'housing', role: 'primary', source: 'structured' }],
};
const responseDouble = () => {
  const json = vi.fn();
  const response = { setHeader: vi.fn(), status: vi.fn(() => response), json } as unknown as VercelResponse;
  return { response, json };
};

describe('atomic assessment save handler', () => {
  it('requires authentication before writing', async () => {
    const save = vi.fn();
    const { response } = responseDouble();
    await createSaveCaseHandler(vi.fn(async () => null), save)({ method: 'POST', body: payload } as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(save).not.toHaveBeenCalled();
  });

  it('returns the canonical committed pet, case, and factors', async () => {
    const persisted = { pet: { id: 'pet-1' }, case: { id: 'case-1' }, factors: [{ id: 'factor-1' }] };
    const save = vi.fn(async () => persisted as never);
    const { response, json } = responseDouble();
    await createSaveCaseHandler(vi.fn(async () => user as never), save)({ method: 'POST', body: payload } as VercelRequest, response);
    expect(save).toHaveBeenCalledWith(user.id, payload);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(persisted);
  });

  it('does not expose a foreign existing case', async () => {
    const save = vi.fn(async () => undefined);
    const { response } = responseDouble();
    await createSaveCaseHandler(vi.fn(async () => user as never), save)({
      method: 'POST', body: { ...payload, caseId: '550e8400-e29b-41d4-a716-446655440000' },
    } as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it('rejects browser-supplied ownership fields', async () => {
    const save = vi.fn();
    const { response } = responseDouble();
    await createSaveCaseHandler(vi.fn(async () => user as never), save)({
      method: 'POST', body: { ...payload, userId: 'user-b' },
    } as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(save).not.toHaveBeenCalled();
  });
});
