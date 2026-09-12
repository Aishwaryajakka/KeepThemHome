import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../http.js';
import { resolveAppUser, type AppUserResolver } from '../../services/auth-service.js';
import { saveOwnedAssessment } from '../../services/save-service.js';
import { saveCaseSchema } from '../../validation/case.js';
import { safeErrorDetails } from '../../auth/diagnostics.js';

export const createSaveCaseHandler = (
  resolveUser: AppUserResolver = resolveAppUser,
  save = saveOwnedAssessment,
) => async (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsed = parseBody(request, saveCaseSchema);
  if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
  try {
    const user = await resolveUser(request);
    if (!user) return response.status(401).json({ error: 'Authentication required' });
    const result = await save(user.id, parsed.data);
    return result
      ? response.status(200).json(result)
      : response.status(404).json({ error: 'Case not found' });
  } catch (error) {
    const details = safeErrorDetails(error);
    console.error(`[save] failure error_name=${details.name}${details.code ? ` error_code=${details.code}` : ''}`);
    return safeServerError(response);
  }
};

export default createSaveCaseHandler();
