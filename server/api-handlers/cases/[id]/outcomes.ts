import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../http';
import { addOutcome, getOutcomes } from '../../../services/case-service';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../services/ownership-service';
import { createOutcomeSchema, uuidSchema } from '../../../validation/case';

export const createOutcomesHandler = (authorize: OwnedCaseResolver = resolveOwnedCase) => async (request: VercelRequest, response: VercelResponse) => {
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });

  try {
    const access = await authorize(request, parsedId.data);
    if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' });
    if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' });
    if (request.method === 'GET') {
      return response.status(200).json({ outcomes: await getOutcomes(parsedId.data) });
    }
    if (request.method === 'POST') {
      const parsed = parseBody(request, createOutcomeSchema);
      if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
      return response.status(201).json({ outcome: await addOutcome(parsedId.data, parsed.data) });
    }
    return methodNotAllowed(response, ['GET', 'POST']);
  } catch {
    return safeServerError(response);
  }
};

export default createOutcomesHandler();
