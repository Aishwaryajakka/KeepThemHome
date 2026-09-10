import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../server/http';
import { getCase, updateCase } from '../../../server/services/case-service';
import { updateCaseSchema, uuidSchema } from '../../../server/validation/case';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });

  try {
    if (request.method === 'GET') {
      const record = await getCase(parsedId.data);
      return record
        ? response.status(200).json({ case: record })
        : response.status(404).json({ error: 'Case not found' });
    }
    if (request.method === 'PATCH') {
      const parsed = parseBody(request, updateCaseSchema);
      if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
      const updated = await updateCase(parsedId.data, parsed.data);
      return updated
        ? response.status(200).json({ case: updated })
        : response.status(404).json({ error: 'Case not found' });
    }
    return methodNotAllowed(response, ['GET', 'PATCH']);
  } catch {
    return safeServerError(response);
  }
}
