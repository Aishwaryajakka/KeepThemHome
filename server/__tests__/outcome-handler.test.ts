import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createOutcomesHandler } from '../api-handlers/cases/[id]/outcomes.js';

const caseId = '550e8400-e29b-41d4-a716-446655440000';
const request = (body: unknown) => ({ method: 'POST', query: { id: caseId }, body } as unknown as VercelRequest);
const responseDouble = () => { const json = vi.fn(); const response = { status: vi.fn(() => response), json, setHeader: vi.fn() } as unknown as VercelResponse; return response; };
const owned = vi.fn(async () => ({ status: 'ok' as const, user: {}, caseRecord: {} })) as never;

describe('controlled case outcomes', () => {
  it.each(['KEEPING_PET', 'STILL_TRYING', 'REHOMING_SUPPORT_NEEDED'] as const)('persists %s only after an explicit request', async (status) => {
    const addOutcome = vi.fn(async (_id, input) => ({ id: 'outcome-1', ...input })); const response = responseDouble();
    await createOutcomesHandler(owned, { addOutcome, getOutcomes: vi.fn() } as never)(request({ status, helpfulFactors: [] }), response);
    expect(addOutcome).toHaveBeenCalledWith(caseId, { status, helpfulFactors: [] });
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it('accepts only controlled helpful factors and never returns private identity fields', async () => {
    const addOutcome = vi.fn(async (_id, input) => ({ id: 'outcome-1', caseId, ...input, notes: null })); const response = responseDouble();
    await createOutcomesHandler(owned, { addOutcome, getOutcomes: vi.fn() } as never)(request({ status: 'KEEPING_PET', helpfulFactors: ['HOUSING_RESOLUTION'] }), response);
    const payload = (response.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toMatch(/userId|authSubject|email|name|location|rawStory/i);
    const invalid = responseDouble();
    await createOutcomesHandler(owned, { addOutcome, getOutcomes: vi.fn() } as never)(request({ status: 'KEEPING_PET', helpfulFactors: ['LANDLORD_JANE'] }), invalid);
    expect(invalid.status).toHaveBeenCalledWith(400);
  });
});
