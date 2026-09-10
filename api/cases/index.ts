import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../server/http';
import { createCase } from '../../server/services/case-service';
import { createCaseSchema } from '../../server/validation/case';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);

  try {
    const parsed = parseBody(request, createCaseSchema);
    if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
    const created = await createCase(parsed.data);
    return response.status(201).json({ case: created });
  } catch {
    return safeServerError(response);
  }
}
