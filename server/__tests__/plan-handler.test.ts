import type { VercelRequest, VercelResponse } from '@vercel/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/plan-service', () => ({ generateCasePlan: vi.fn() }));

import planHandler from '../../api/cases/[id]/plan';
import { generateCasePlan } from '../services/plan-service';

const responseDouble = () => {
  const json = vi.fn();
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(() => response),
    json,
  } as unknown as VercelResponse;
  return { response, json };
};

describe('plan API handler', () => {
  beforeEach(() => vi.mocked(generateCasePlan).mockReset());

  it('rejects an invalid case ID', async () => {
    const { response, json } = responseDouble();
    await planHandler({ method: 'POST', query: { id: 'bad-id' } } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Invalid case ID' });
    expect(generateCasePlan).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing case', async () => {
    vi.mocked(generateCasePlan).mockResolvedValue(undefined);
    const { response, json } = responseDouble();
    await planHandler({
      method: 'POST',
      query: { id: '550e8400-e29b-41d4-a716-446655440000' },
    } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'Case not found' });
  });
});
