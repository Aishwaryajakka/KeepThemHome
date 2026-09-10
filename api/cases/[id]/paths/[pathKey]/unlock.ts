import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UnsupportedCounterfactualError } from '../../../../../server/counterfactual/catalog';
import { methodNotAllowed, parseBody, safeServerError } from '../../../../../server/http';
import { generateSmallestUnlock } from '../../../../../server/services/counterfactual-service';
import { uuidSchema } from '../../../../../server/validation/case';
import { hypotheticalChangesSchema, pathKeySchema } from '../../../../../server/validation/counterfactual';

type UnlockGenerator = typeof generateSmallestUnlock;

export const createUnlockHandler = (generateUnlock: UnlockGenerator = generateSmallestUnlock) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });
  const parsedPath = pathKeySchema.safeParse(request.query.pathKey);
  if (!parsedPath.success) return response.status(400).json({ error: 'Invalid path key' });
  const parsedBody = parseBody(request, hypotheticalChangesSchema);
  if (!parsedBody.success) return response.status(400).json({ error: 'Invalid hypothetical changes' });

  try {
    const result = await generateUnlock(parsedId.data, parsedPath.data, parsedBody.data.appliedChanges ?? []);
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

export default createUnlockHandler();
