import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, safeServerError } from '../../../server/http';
import { generateRetentionPaths } from '../../../server/services/path-service';
import { uuidSchema } from '../../../server/validation/case';

type PathGenerator = typeof generateRetentionPaths;

export const createPathsHandler = (generatePaths: PathGenerator = generateRetentionPaths) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });

  try {
    const result = await generatePaths(parsedId.data);
    return result
      ? response.status(200).json(result)
      : response.status(404).json({ error: 'Case not found' });
  } catch {
    return safeServerError(response);
  }
};

export default createPathsHandler();
