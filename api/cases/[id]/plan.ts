import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, safeServerError } from '../../../server/http';
import { generateCasePlan } from '../../../server/services/plan-service';
import { uuidSchema } from '../../../server/validation/case';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });

  try {
    const plan = await generateCasePlan(parsedId.data);
    return plan
      ? response.status(200).json(plan)
      : response.status(404).json({ error: 'Case not found' });
  } catch {
    return safeServerError(response);
  }
}
