import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../../server/http';
import { UnsupportedCounterfactualError } from '../../../server/counterfactual/catalog';
import { generateRetentionPaths } from '../../../server/services/path-service';
import { uuidSchema } from '../../../server/validation/case';
import { hypotheticalChangesSchema } from '../../../server/validation/counterfactual';

type PathGenerator = typeof generateRetentionPaths;

export const createPathsHandler = (generatePaths: PathGenerator = generateRetentionPaths) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });
  const parsedBody = parseBody(request, hypotheticalChangesSchema);
  if (!parsedBody.success) return response.status(400).json({ error: 'Invalid hypothetical changes' });

  try {
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
