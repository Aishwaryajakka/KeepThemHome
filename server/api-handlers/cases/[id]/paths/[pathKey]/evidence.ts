import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, safeServerError } from '../../../../../http.js';
import { EvidencePathNotFoundError, getCasePathEvidence } from '../../../../../services/evidence-service.js';
import { uuidSchema } from '../../../../../validation/case.js';
import { pathKeySchema } from '../../../../../validation/counterfactual.js';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../../../services/ownership-service.js';

type EvidenceGetter = typeof getCasePathEvidence;

export const createEvidenceHandler = (getEvidence: EvidenceGetter = getCasePathEvidence, authorize: OwnedCaseResolver = resolveOwnedCase) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  const parsedPath = pathKeySchema.safeParse(request.query.pathKey);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });
  if (!parsedPath.success) return response.status(400).json({ error: 'Invalid path key' });

  try {
    const access = await authorize(request, parsedId.data);
    if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' });
    if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' });
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
