import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UnsupportedCounterfactualError } from '../../../counterfactual/catalog';
import { methodNotAllowed, parseBody, safeServerError } from '../../../http';
import { ExplanationPathNotFoundError, explainCasePath } from '../../../services/explanation-service';
import { uuidSchema } from '../../../validation/case';
import { explanationRequestSchema } from '../../../validation/explanation';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../services/ownership-service';

type Explainer = typeof explainCasePath;

export const createExplainHandler = (explain: Explainer = explainCasePath, authorize: OwnedCaseResolver = resolveOwnedCase) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });
  const parsedBody = parseBody(request, explanationRequestSchema);
  if (!parsedBody.success) return response.status(400).json({ error: 'Invalid explanation request' });
  try {
    const access = await authorize(request, parsedId.data);
    if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' });
    if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' });
    const result = await explain(
      parsedId.data,
      parsedBody.data.pathKey,
      parsedBody.data.mode,
      parsedBody.data.appliedChanges ?? [],
    );
    return result
      ? response.status(200).json(result)
      : response.status(404).json({ error: 'Case not found' });
  } catch (error) {
    if (error instanceof UnsupportedCounterfactualError || error instanceof ExplanationPathNotFoundError) {
      return response.status(400).json({ error: 'Requested explanation is not supported for the current case' });
    }
    return safeServerError(response);
  }
};

export default createExplainHandler();
