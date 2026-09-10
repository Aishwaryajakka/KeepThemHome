import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, safeServerError } from '../../../http';
import { generateCasePlan } from '../../../services/plan-service';
import { uuidSchema } from '../../../validation/case';
import { resolveOwnedCase, type OwnedCaseResolver } from '../../../services/ownership-service';

export const createPlanHandler = (generatePlan = generateCasePlan, authorize: OwnedCaseResolver = resolveOwnedCase) => async (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsedId = uuidSchema.safeParse(request.query.id);
  if (!parsedId.success) return response.status(400).json({ error: 'Invalid case ID' });

  try {
    const access = await authorize(request, parsedId.data);
    if (access.status === 'unauthenticated') return response.status(401).json({ error: 'Authentication required' });
    if (access.status === 'not_found') return response.status(404).json({ error: 'Case not found' });
    const plan = await generatePlan(parsedId.data);
    return plan
      ? response.status(200).json(plan)
      : response.status(404).json({ error: 'Case not found' });
  } catch {
    return safeServerError(response);
  }
};

export default createPlanHandler();
