import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, safeServerError } from '../../../http.js';
import { findSimilarCases } from '../../../services/similarity-service.js';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../services/ownership-service.js';
import { uuidSchema } from '../../../validation/case.js';

export const createSimilarCasesHandler = (authorize: OwnedCaseResolver = resolveOwnedCase, search = findSimilarCases) => async (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  const id = uuidSchema.safeParse(request.query.id);
  if (!id.success) return response.status(400).json({ error: 'Invalid case ID' });
  try {
    const access = await authorize(request, id.data);
    if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' });
    if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' });
    return response.status(200).json({ cases: await search(id.data), disclaimer: 'Similarity describes circumstances, not likelihood of success.' });
  } catch { return safeServerError(response); }
};
export default createSimilarCasesHandler();
