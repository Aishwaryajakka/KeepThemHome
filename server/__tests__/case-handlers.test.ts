import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import caseHandler from '../../api/cases/[id]/index';
import createCaseHandler from '../../api/cases/index';

const responseDouble = () => {
  const json = vi.fn();
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(() => response),
    json,
  } as unknown as VercelResponse;
  return { response, json };
};

describe('case API handlers', () => {
  it('returns 400 for a malformed case UUID without touching the database', async () => {
    const { response, json } = responseDouble();

    await caseHandler({ method: 'GET', query: { id: 'not-a-uuid' } } as unknown as VercelRequest, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Invalid case ID' });
  });

  it('returns 400 for an invalid create-case payload without touching the database', async () => {
    const { response, json } = responseDouble();

    await createCaseHandler({ method: 'POST', body: { petName: '', petType: 'horse' } } as VercelRequest, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid request' }));
  });
});
