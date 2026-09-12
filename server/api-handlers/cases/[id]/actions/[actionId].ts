import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../../http';
import { updateCaseAction } from '../../../../services/action-service';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../../services/ownership-service';
import { updateActionSchema } from '../../../../validation/action';
import { uuidSchema } from '../../../../validation/case';
export const createActionHandler = (authorize: OwnedCaseResolver = resolveOwnedCase, update = updateCaseAction) => async (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== 'PATCH') return methodNotAllowed(response, ['PATCH']);
  const id = uuidSchema.safeParse(request.query.id); const actionId = uuidSchema.safeParse(request.query.actionId); if (!id.success || !actionId.success) return response.status(400).json({ error: 'Invalid ID' });
  const body = parseBody(request, updateActionSchema); if (!body.success) return response.status(400).json({ error: 'Invalid request', issues: body.error.flatten() });
  try { const access = await authorize(request, id.data); if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' }); if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' }); const action = await update(id.data, actionId.data, body.data); return action ? response.status(200).json({ action }) : response.status(404).json({ error: 'Action not found' }); } catch { return safeServerError(response); }
};
export default createActionHandler();
