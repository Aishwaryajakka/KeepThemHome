import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../http.js';
import { resolveAppUser, type AppUserResolver } from '../../services/auth-service.js';
import { createOwnedPet, listOwnedPets } from '../../services/pet-service.js';
import { createPetSchema } from '../../validation/pet.js';

export const createPetsHandler = (resolveUser: AppUserResolver = resolveAppUser, services = { createOwnedPet, listOwnedPets }) => async (request: VercelRequest, response: VercelResponse) => {
  if (!['GET', 'POST'].includes(request.method ?? '')) return methodNotAllowed(response, ['GET', 'POST']);
  try {
    const user = await resolveUser(request);
    if (!user) return response.status(401).json({ error: 'Authentication required' });
    if (request.method === 'GET') return response.status(200).json({ pets: await services.listOwnedPets(user.id) });
    const parsed = parseBody(request, createPetSchema);
    if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
    return response.status(201).json({ pet: await services.createOwnedPet(user.id, parsed.data) });
  } catch { return safeServerError(response); }
};
export default createPetsHandler();
