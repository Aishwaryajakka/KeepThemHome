import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, safeServerError } from '../../http';
import { listVerifiedResources } from '../../services/resource-service';
import { resourceQuerySchema } from '../../validation/resource';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  const parsed = resourceQuerySchema.safeParse(request.query);
  if (!parsed.success) return response.status(400).json({ error: 'Invalid resource filter' });

  try {
    return response.status(200).json({ resources: await listVerifiedResources(parsed.data.category) });
  } catch {
    return safeServerError(response);
  }
}
