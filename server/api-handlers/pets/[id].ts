import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../http.js';
import { resolveAppUser, type AppUserResolver } from '../../services/auth-service.js';
import { getOwnedPet } from '../../services/ownership-service.js';
import { deleteOwnedPet, updateOwnedPet } from '../../services/pet-service.js';
import { uuidSchema } from '../../validation/case.js';
import { updatePetSchema } from '../../validation/pet.js';

export const createPetHandler = (resolveUser: AppUserResolver = resolveAppUser, services = { getOwnedPet, updateOwnedPet, deleteOwnedPet }) => async (request: VercelRequest, response: VercelResponse) => {
  if (!['GET', 'PATCH', 'DELETE'].includes(request.method ?? '')) return methodNotAllowed(response, ['GET', 'PATCH', 'DELETE']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid pet ID' });
  try {
    const user = await resolveUser(request);
    if (!user) return response.status(401).json({ error: 'Authentication required' });
    if (request.method === 'GET') {
      const pet = await services.getOwnedPet(user.id, parsedId.data);
      return pet ? response.status(200).json({ pet }) : response.status(404).json({ error: 'Pet not found' });
    }
    if (request.method === 'DELETE') {
      const pet = await services.deleteOwnedPet(user.id, parsedId.data);
      console.info(`[pet-delete] success=${Boolean(pet)}`);
      return pet ? response.status(200).json({ deleted: true, petId: pet.id }) : response.status(404).json({ error: 'Pet not found' });
    }
    const parsed = parseBody(request, updatePetSchema);
    if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
    const pet = await services.updateOwnedPet(user.id, parsedId.data, parsed.data);
    return pet ? response.status(200).json({ pet }) : response.status(404).json({ error: 'Pet not found' });
  } catch { return safeServerError(response); }
};
export default createPetHandler();
