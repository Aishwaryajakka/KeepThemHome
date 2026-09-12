import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createApiRouter, type ApiHandler, type ApiHandlers } from '../api-router.js';
import { createMeHandler } from '../api-handlers/me.js';
import { createPathsHandler } from '../api-handlers/cases/[id]/paths.js';

const caseId = '550e8400-e29b-41d4-a716-446655440000';
const petId = '650e8400-e29b-41d4-a716-446655440000';

const responseDouble = () => {
  const json = vi.fn();
  const response = { setHeader: vi.fn(), status: vi.fn(() => response), json } as unknown as VercelResponse;
  return { response, json };
};

const request = (method: string, path: string, body?: unknown) => ({
  method,
  url: `/api/${path}`,
  query: { path },
  body,
}) as unknown as VercelRequest;

const handlerSet = () => {
  const make = (): ApiHandler => vi.fn(async (_request, response) => response.status(204).json({}));
  const handlers: ApiHandlers = {
    me: make(), pets: make(), pet: make(), cases: make(), case: make(), factors: make(), outcomes: make(),
    plan: make(), paths: make(), unlock: make(), explain: make(), evidence: make(), intake: make(),
    resources: make(), evidencePreview: make(),
    actions: make(), action: make(), actionOutcome: make(), similar: make(),
    saveCase: make(),
  };
  return handlers;
};

describe('consolidated API router', () => {
  it.each([
    ['me', 'GET', 'me'],
    ['pets', 'GET', 'pets'],
    ['pets', 'POST', 'pets'],
    [`pets/${petId}`, 'GET', 'pet'],
    ['cases', 'GET', 'cases'],
    ['cases', 'POST', 'cases'],
    ['cases/save', 'POST', 'saveCase'],
    [`cases/${caseId}`, 'GET', 'case'],
    [`cases/${caseId}/factors`, 'GET', 'factors'],
    [`cases/${caseId}/outcomes`, 'POST', 'outcomes'],
    [`cases/${caseId}/plan`, 'POST', 'plan'],
    [`cases/${caseId}/paths`, 'POST', 'paths'],
    [`cases/${caseId}/paths/stay_and_resolve/unlock`, 'POST', 'unlock'],
    [`cases/${caseId}/explain`, 'POST', 'explain'],
    [`cases/${caseId}/paths/stay_and_resolve/evidence`, 'GET', 'evidence'],
    ['intake/extract', 'POST', 'intake'],
    ['resources', 'GET', 'resources'],
    ['evidence/preview', 'POST', 'evidencePreview'],
    [`cases/${caseId}/actions`, 'GET', 'actions'],
    [`cases/${caseId}/actions/${petId}`, 'PATCH', 'action'],
    [`cases/${caseId}/actions/${petId}/outcome`, 'POST', 'actionOutcome'],
    [`cases/${caseId}/similar`, 'GET', 'similar'],
  ] as const)('routes /api/%s %s to %s', async (path, method, key) => {
    const handlers = handlerSet();
    await createApiRouter(handlers)(request(method, path), responseDouble().response);
    expect(handlers[key]).toHaveBeenCalledOnce();
  });

  it('injects controlled path parameters before delegation', async () => {
    const handlers = handlerSet();
    const routed = request('GET', `cases/${caseId}/paths/stay_and_resolve/evidence`);
    await createApiRouter(handlers)(routed, responseDouble().response);
    expect(routed.query).toMatchObject({ id: caseId, pathKey: 'stay_and_resolve' });
  });

  it('removes the internal rewrite parameter and preserves public query parameters', async () => {
    const handlers = handlerSet();
    const routed = {
      method: 'GET',
      url: '/api/resources?category=housing-search',
      query: { path: 'resources', category: 'housing-search' },
    } as unknown as VercelRequest;
    await createApiRouter(handlers)(routed, responseDouble().response);
    expect(handlers.resources).toHaveBeenCalledOnce();
    expect(routed.query).toEqual({ category: 'housing-search' });
  });

  it('preserves the Authorization header when routing /api/me', async () => {
    const handlers = handlerSet();
    const routed = request('GET', 'me');
    routed.headers = { authorization: 'Bearer test-token' };
    await createApiRouter(handlers)(routed, responseDouble().response);
    expect(handlers.me).toHaveBeenCalledWith(
      expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer test-token' }) }),
      expect.anything(),
    );
  });

  it('falls back to the original API URL when no rewrite parameter is present', async () => {
    const handlers = handlerSet();
    const routed = {
      method: 'GET',
      url: `/api/cases/${caseId}/paths/stay_and_resolve/evidence?source=demo`,
      query: { source: 'demo' },
    } as unknown as VercelRequest;
    await createApiRouter(handlers)(routed, responseDouble().response);
    expect(handlers.evidence).toHaveBeenCalledOnce();
    expect(routed.query).toMatchObject({ source: 'demo', id: caseId, pathKey: 'stay_and_resolve' });
  });

  it('returns 404 for an unknown API route', async () => {
    const { response, json } = responseDouble();
    await createApiRouter(handlerSet())(request('GET', 'unknown'), response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'API route not found' });
  });

  it('preserves handler-level 405 responses for a known route', async () => {
    const handlers = handlerSet();
    handlers.me = createMeHandler(vi.fn());
    const { response } = responseDouble();
    await createApiRouter(handlers)(request('POST', 'me'), response);
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.setHeader).toHaveBeenCalledWith('Allow', 'GET');
  });

  it('runs ownership before private solver computation through the router', async () => {
    const handlers = handlerSet();
    const solver = vi.fn();
    const authorize = vi.fn(async () => ({ status: 'not_found' as const }));
    handlers.paths = createPathsHandler(solver, authorize);
    const { response } = responseDouble();
    await createApiRouter(handlers)(request('POST', `cases/${caseId}/paths`, {}), response);
    expect(authorize).toHaveBeenCalledWith(expect.anything(), caseId);
    expect(solver).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(404);
  });
});
