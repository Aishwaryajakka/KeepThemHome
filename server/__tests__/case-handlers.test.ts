import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createCaseHandler } from '../api-handlers/cases/[id]';
import { createCasesHandler } from '../api-handlers/cases';

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

    await createCaseHandler(vi.fn())({ method: 'GET', query: { id: 'not-a-uuid' } } as unknown as VercelRequest, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Invalid case ID' });
  });

  it('returns 400 for an invalid create-case payload without touching the database', async () => {
    const { response, json } = responseDouble();

    const user = vi.fn(async () => ({ id: 'user-a' } as never));
    await createCasesHandler(user)({ method: 'POST', body: { petName: '', petType: 'horse' } } as VercelRequest, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid request' }));
  });
});
