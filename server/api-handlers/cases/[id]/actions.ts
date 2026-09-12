import type { VercelRequest, VercelResponse } from '@vercel/node';
import { actionCatalog } from '../../../actions/catalog';
import { methodNotAllowed, parseBody, safeServerError } from '../../../http';
import { addCaseAction, listCaseActions, listCaseEvents } from '../../../services/action-service';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../services/ownership-service';
import { createActionSchema } from '../../../validation/action';
import { uuidSchema } from '../../../validation/case';

export const createActionsHandler = (authorize: OwnedCaseResolver = resolveOwnedCase, services = { addCaseAction, listCaseActions, listCaseEvents }) => async (request: VercelRequest, response: VercelResponse) => {
  const id = uuidSchema.safeParse(request.query.id); if (!id.success) return response.status(400).json({ error: 'Invalid case ID' });
  try {
    const access = await authorize(request, id.data); if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' }); if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' });
    if (request.method === 'GET') return response.status(200).json({ actions: await services.listCaseActions(id.data), events: await services.listCaseEvents(id.data), recommended: actionCatalog });
    if (request.method === 'POST') { const body = parseBody(request, createActionSchema); if (!body.success) return response.status(400).json({ error: 'Invalid request' }); const action = await services.addCaseAction(id.data, body.data.pathKey, body.data.actionKey); return action ? response.status(201).json({ action }) : response.status(400).json({ error: 'Unsupported action' }); }
    return methodNotAllowed(response, ['GET', 'POST']);
  } catch { return safeServerError(response); }
};
export default createActionsHandler();
