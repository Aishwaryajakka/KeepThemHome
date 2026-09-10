import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../server/http';
import { addOutcome, getCase, getOutcomes } from '../../../server/services/case-service';
import { createOutcomeSchema, uuidSchema } from '../../../server/validation/case';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });

  try {
    if (!await getCase(parsedId.data)) return response.status(404).json({ error: 'Case not found' });
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
}
