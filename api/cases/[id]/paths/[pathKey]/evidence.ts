import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, safeServerError } from '../../../../../server/http';
import { EvidencePathNotFoundError, getCasePathEvidence } from '../../../../../server/services/evidence-service';
import { uuidSchema } from '../../../../../server/validation/case';
import { pathKeySchema } from '../../../../../server/validation/counterfactual';

type EvidenceGetter = typeof getCasePathEvidence;

export const createEvidenceHandler = (getEvidence: EvidenceGetter = getCasePathEvidence) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  const parsedPath = pathKeySchema.safeParse(request.query.pathKey);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });
  if (!parsedPath.success) return response.status(400).json({ error: 'Invalid path key' });

  try {
    const result = await getEvidence(parsedId.data, parsedPath.data, []);
    return result
      ? response.status(200).json(result)
      : response.status(404).json({ error: 'Case not found' });
  } catch (error) {
    if (error instanceof EvidencePathNotFoundError) return response.status(404).json({ error: 'Path not found' });
    return safeServerError(response);
  }
};

export default createEvidenceHandler();
