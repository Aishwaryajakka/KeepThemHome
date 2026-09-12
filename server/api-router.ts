import type { VercelRequest, VercelResponse } from '@vercel/node';
import meHandler from './api-handlers/me';
import petsHandler from './api-handlers/pets';
import petHandler from './api-handlers/pets/[id]';
import casesHandler from './api-handlers/cases';
import caseHandler from './api-handlers/cases/[id]';
import factorsHandler from './api-handlers/cases/[id]/factors';
import outcomesHandler from './api-handlers/cases/[id]/outcomes';
import planHandler from './api-handlers/cases/[id]/plan';
import pathsHandler from './api-handlers/cases/[id]/paths';
import unlockHandler from './api-handlers/cases/[id]/paths/[pathKey]/unlock';
import explainHandler from './api-handlers/cases/[id]/explain';
import evidenceHandler from './api-handlers/cases/[id]/paths/[pathKey]/evidence';
import intakeHandler from './api-handlers/intake/extract';
import resourcesHandler from './api-handlers/resources';
import evidencePreviewHandler from './api-handlers/evidence/preview';

export type ApiHandler = (request: VercelRequest, response: VercelResponse) => unknown;

export interface ApiHandlers {
  me: ApiHandler;
  pets: ApiHandler;
  pet: ApiHandler;
  cases: ApiHandler;
  case: ApiHandler;
  factors: ApiHandler;
  outcomes: ApiHandler;
  plan: ApiHandler;
  paths: ApiHandler;
  unlock: ApiHandler;
  explain: ApiHandler;
  evidence: ApiHandler;
  intake: ApiHandler;
  resources: ApiHandler;
  evidencePreview: ApiHandler;
}

const defaultHandlers: ApiHandlers = {
  me: meHandler,
  pets: petsHandler,
  pet: petHandler,
  cases: casesHandler,
  case: caseHandler,
  factors: factorsHandler,
  outcomes: outcomesHandler,
  plan: planHandler,
  paths: pathsHandler,
  unlock: unlockHandler,
  explain: explainHandler,
  evidence: evidenceHandler,
  intake: intakeHandler,
  resources: resourcesHandler,
  evidencePreview: evidencePreviewHandler,
};

const routePath = (request: VercelRequest) => {
  const rewritten = request.query.path;
  if (typeof rewritten === 'string') return rewritten.replace(/^\/+|\/+$/g, '');
  if (Array.isArray(rewritten)) return rewritten.join('/').replace(/^\/+|\/+$/g, '');
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  return pathname.replace(/^\/api\/?/, '').replace(/\/+$/g, '');
};

const withParams = (request: VercelRequest, params: Record<string, string>) => {
  request.query = { ...request.query, ...params };
};

export const createApiRouter = (handlers: ApiHandlers = defaultHandlers) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  const path = routePath(request);
  const { path: _internalRewritePath, ...publicQuery } = request.query;
  request.query = publicQuery;

  if (path === 'me') return handlers.me(request, response);
  if (path === 'pets') return handlers.pets(request, response);
  if (path === 'cases') return handlers.cases(request, response);
  if (path === 'intake/extract') return handlers.intake(request, response);
  if (path === 'resources') return handlers.resources(request, response);
  if (path === 'evidence/preview') return handlers.evidencePreview(request, response);

  let match = /^pets\/([^/]+)$/.exec(path);
  if (match) {
    withParams(request, { id: decodeURIComponent(match[1]) });
    return handlers.pet(request, response);
  }

  match = /^cases\/([^/]+)$/.exec(path);
  if (match) {
    withParams(request, { id: decodeURIComponent(match[1]) });
    return handlers.case(request, response);
  }

  match = /^cases\/([^/]+)\/(factors|outcomes|plan|paths|explain)$/.exec(path);
  if (match) {
    withParams(request, { id: decodeURIComponent(match[1]) });
    const handler = handlers[match[2] as 'factors' | 'outcomes' | 'plan' | 'paths' | 'explain'];
    return handler(request, response);
  }

  match = /^cases\/([^/]+)\/paths\/([^/]+)\/(unlock|evidence)$/.exec(path);
  if (match) {
    withParams(request, { id: decodeURIComponent(match[1]), pathKey: decodeURIComponent(match[2]) });
    return handlers[match[3] as 'unlock' | 'evidence'](request, response);
  }

  return response.status(404).json({ error: 'API route not found' });
};

export default createApiRouter();
