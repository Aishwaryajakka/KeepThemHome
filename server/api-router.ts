import type { VercelRequest, VercelResponse } from '@vercel/node';
import meHandler from './api-handlers/me.js';
import petsHandler from './api-handlers/pets.js';
import petHandler from './api-handlers/pets/[id].js';
import casesHandler from './api-handlers/cases.js';
import caseHandler from './api-handlers/cases/[id].js';
import factorsHandler from './api-handlers/cases/[id]/factors.js';
import outcomesHandler from './api-handlers/cases/[id]/outcomes.js';
import planHandler from './api-handlers/cases/[id]/plan.js';
import pathsHandler from './api-handlers/cases/[id]/paths.js';
import unlockHandler from './api-handlers/cases/[id]/paths/[pathKey]/unlock.js';
import explainHandler from './api-handlers/cases/[id]/explain.js';
import evidenceHandler from './api-handlers/cases/[id]/paths/[pathKey]/evidence.js';
import intakeHandler from './api-handlers/intake/extract.js';
import resourcesHandler from './api-handlers/resources.js';
import evidencePreviewHandler from './api-handlers/evidence/preview.js';
import actionsHandler from './api-handlers/cases/[id]/actions.js';
import actionHandler from './api-handlers/cases/[id]/actions/[actionId].js';
import actionOutcomeHandler from './api-handlers/cases/[id]/actions/[actionId]/outcome.js';
import similarHandler from './api-handlers/cases/[id]/similar.js';

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
  actions?: ApiHandler;
  action?: ApiHandler;
  actionOutcome?: ApiHandler;
  similar?: ApiHandler;
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
  actions: actionsHandler,
  action: actionHandler,
  actionOutcome: actionOutcomeHandler,
  similar: similarHandler,
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

  match = /^cases\/([^/]+)\/actions$/.exec(path);
  if (match && handlers.actions) { withParams(request, { id: decodeURIComponent(match[1]) }); return handlers.actions(request, response); }
  match = /^cases\/([^/]+)\/actions\/([^/]+)$/.exec(path);
  if (match && handlers.action) { withParams(request, { id: decodeURIComponent(match[1]), actionId: decodeURIComponent(match[2]) }); return handlers.action(request, response); }
  match = /^cases\/([^/]+)\/actions\/([^/]+)\/outcome$/.exec(path);
  if (match && handlers.actionOutcome) { withParams(request, { id: decodeURIComponent(match[1]), actionId: decodeURIComponent(match[2]) }); return handlers.actionOutcome(request, response); }
  match = /^cases\/([^/]+)\/similar$/.exec(path);
  if (match && handlers.similar) { withParams(request, { id: decodeURIComponent(match[1]) }); return handlers.similar(request, response); }

  return response.status(404).json({ error: 'API route not found' });
};

export default createApiRouter();
