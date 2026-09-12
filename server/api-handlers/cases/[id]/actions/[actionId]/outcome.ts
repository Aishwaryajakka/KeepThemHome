import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../../../http.js';
import { recordActionOutcome } from '../../../../../services/action-service.js';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../../../services/ownership-service.js';
import { actionOutcomeSchema } from '../../../../../validation/action.js';
import { uuidSchema } from '../../../../../validation/case.js';
export const createActionOutcomeHandler = (authorize: OwnedCaseResolver = resolveOwnedCase, record = recordActionOutcome) => async (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const id = uuidSchema.safeParse(request.query.id); const actionId = uuidSchema.safeParse(request.query.actionId); if (!id.success || !actionId.success) return response.status(400).json({ error: 'Invalid ID' });
  const body = parseBody(request, actionOutcomeSchema); if (!body.success) return response.status(400).json({ error: 'Invalid request' });
  try { const access = await authorize(request, id.data); if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' }); if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' }); const result = await record(id.data, actionId.data, body.data.outcomeKey, body.data.resultNote); return result.status === 'ok' ? response.status(200).json(result) : response.status(400).json({ error: 'Unsupported outcome or action is not completed' }); } catch { return safeServerError(response); }
};
export default createActionOutcomeHandler();
