import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../http.js';
import { resolveAppUser, type AppUserResolver } from '../../../services/auth-service.js';
import { deleteOwnedCase, getCaseFactors, getOutcomes, updateOwnedCase } from '../../../services/case-service.js';
import { getOwnedCase, getOwnedPet } from '../../../services/ownership-service.js';
import { updateCaseSchema, uuidSchema } from '../../../validation/case.js';

export const createCaseHandler = (resolveUser: AppUserResolver = resolveAppUser, services = { getOwnedCase, getOwnedPet, getCaseFactors, getOutcomes, updateOwnedCase, deleteOwnedCase }) => async (request: VercelRequest, response: VercelResponse) => {
  if (!['GET', 'PATCH', 'DELETE'].includes(request.method ?? '')) return methodNotAllowed(response, ['GET', 'PATCH', 'DELETE']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });
  try {
    const user = await resolveUser(request);
    if (!user) return response.status(401).json({ error: 'Authentication required' });
    const owned = await services.getOwnedCase(user.id, parsedId.data);
    if (!owned) return response.status(404).json({ error: 'Case not found' });
    if (request.method === 'DELETE') {
      const deleted = await services.deleteOwnedCase(user.id, parsedId.data);
      console.info(`[case-delete] success=${Boolean(deleted)}`);
      return deleted ? response.status(200).json({ deleted: true, caseId: deleted.id }) : response.status(404).json({ error: 'Case not found' });
    }
    if (request.method === 'GET') {
      const [factors, outcomes, pet] = await Promise.all([
        services.getCaseFactors(owned.id), services.getOutcomes(owned.id),
        owned.petId ? services.getOwnedPet(user.id, owned.petId) : undefined,
      ]);
      return response.status(200).json({ case: owned, pet: pet ?? null, factors, outcomes });
    }
    const parsed = parseBody(request, updateCaseSchema);
    if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
    return response.status(200).json({ case: await services.updateOwnedCase(user.id, parsedId.data, parsed.data) });
  } catch { return safeServerError(response); }
};
export default createCaseHandler();
