import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../http.js';
import { UnsupportedCounterfactualError } from '../../../counterfactual/catalog.js';
import { generateRetentionPaths } from '../../../services/path-service.js';
import { uuidSchema } from '../../../validation/case.js';
import { hypotheticalChangesSchema } from '../../../validation/counterfactual.js';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../services/ownership-service.js';

type PathGenerator = typeof generateRetentionPaths;

export const createPathsHandler = (generatePaths: PathGenerator = generateRetentionPaths, authorize: OwnedCaseResolver = resolveOwnedCase) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });
  const parsedBody = parseBody(request, hypotheticalChangesSchema);
  if (!parsedBody.success) return response.status(400).json({ error: 'Invalid hypothetical changes' });

  try {
    const access = await authorize(request, parsedId.data);
    if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' });
    if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' });
    const result = await generatePaths(parsedId.data, parsedBody.data.appliedChanges ?? []);
    return result
      ? response.status(200).json(result)
      : response.status(404).json({ error: 'Case not found' });
  } catch (error) {
    if (error instanceof UnsupportedCounterfactualError) {
      return response.status(400).json({ error: 'Hypothetical change is not supported for the current case' });
    }
    return safeServerError(response);
  }
};

export default createPathsHandler();
