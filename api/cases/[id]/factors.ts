import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../server/http';
import { addCaseFactors, getCaseFactors } from '../../../server/services/case-service';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../server/services/ownership-service';
import { createFactorsSchema, uuidSchema } from '../../../server/validation/case';

export const createFactorsHandler = (authorize: OwnedCaseResolver = resolveOwnedCase) => async (request: VercelRequest, response: VercelResponse) => {
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });

  try {
    const access = await authorize(request, parsedId.data);
    if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' });
    if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' });
    if (request.method === 'GET') {
      return response.status(200).json({ factors: await getCaseFactors(parsedId.data) });
    }
    if (request.method === 'POST') {
      const parsed = parseBody(request, createFactorsSchema);
      if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
      return response.status(201).json({ factors: await addCaseFactors(parsedId.data, parsed.data) });
    }
    return methodNotAllowed(response, ['GET', 'POST']);
  } catch {
    return safeServerError(response);
  }
};

export default createFactorsHandler();
