import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createPathsHandler } from '../../api/cases/[id]/paths';

const caseId = '550e8400-e29b-41d4-a716-446655440000';
const responseDouble = () => {
  const json = vi.fn();
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(() => response),
    json,
  } as unknown as VercelResponse;
  return { response, json };
};

const request = (method: string, id = caseId) => ({ method, query: { id }, body: {} }) as unknown as VercelRequest;

describe('retention paths API handler', () => {
  it('rejects invalid UUIDs and unsupported methods', async () => {
    const pathsHandler = createPathsHandler(vi.fn());
    const invalid = responseDouble();
    await pathsHandler(request('POST', 'bad-id'), invalid.response);
    expect(invalid.response.status).toHaveBeenCalledWith(400);

    const method = responseDouble();
    await pathsHandler(request('GET'), method.response);
    expect(method.response.status).toHaveBeenCalledWith(405);
    expect(method.response.setHeader).toHaveBeenCalledWith('Allow', 'POST');
  });

  it('returns 404 for a missing case', async () => {
    const pathsHandler = createPathsHandler(vi.fn().mockResolvedValue(undefined));
    const { response } = responseDouble();
    await pathsHandler(request('POST'), response);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it('returns the structured solver result', async () => {
    const pathsHandler = createPathsHandler(vi.fn().mockResolvedValue({ caseId, paths: [] }));
    const { response, json } = responseDouble();
    await pathsHandler(request('POST'), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ caseId, paths: [] });
  });

  it('sanitizes service failures', async () => {
    const pathsHandler = createPathsHandler(vi.fn().mockRejectedValue(new Error('database secret')));
    const { response, json } = responseDouble();
    await pathsHandler(request('POST'), response);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Unable to complete the request' });
  });
});
