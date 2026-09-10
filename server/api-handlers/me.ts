import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, safeServerError } from '../http';
import { resolveAppUser, type AppUserResolver } from '../services/auth-service';

export const createMeHandler = (resolveUser: AppUserResolver = resolveAppUser) => async (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  try {
    const user = await resolveUser(request);
    return user ? response.status(200).json({ id: user.id, email: user.email }) : response.status(401).json({ error: 'Authentication required' });
  } catch { return safeServerError(response); }
};
export default createMeHandler();
