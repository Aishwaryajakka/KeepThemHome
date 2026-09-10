import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../http';
import { resolveAppUser, type AppUserResolver } from '../../services/auth-service';
import { createOwnedCase, listOwnedCases } from '../../services/case-service';
import { getOwnedPet } from '../../services/ownership-service';
import { createOwnedCaseSchema } from '../../validation/case';

export const createCasesHandler = (resolveUser: AppUserResolver = resolveAppUser, services = { createOwnedCase, listOwnedCases, getOwnedPet }) => async (request: VercelRequest, response: VercelResponse) => {
  if (!['GET', 'POST'].includes(request.method ?? '')) return methodNotAllowed(response, ['GET', 'POST']);
  try {
    const user = await resolveUser(request);
    if (!user) return response.status(401).json({ error: 'Authentication required' });
    if (request.method === 'GET') return response.status(200).json({ cases: await services.listOwnedCases(user.id) });
    const parsed = parseBody(request, createOwnedCaseSchema);
    if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
    const pet = await services.getOwnedPet(user.id, parsed.data.petId);
    if (!pet) return response.status(404).json({ error: 'Pet not found' });
    return response.status(201).json({ case: await services.createOwnedCase(user.id, pet, parsed.data) });
  } catch { return safeServerError(response); }
};
export default createCasesHandler();
