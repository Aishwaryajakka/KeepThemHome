import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody } from '../../http.js';
import { ExtractionFailedError, extractIntake, ProviderUnavailableError } from '../../intake/groq.js';
import { selectIntakeFollowUps } from '../../intake/follow-ups.js';
import { intakeRequestSchema } from '../../validation/intake.js';

const createRequestId = () => Math.random().toString(36).slice(2, 10);

export const createIntakeHandler = (extract = extractIntake) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  const id = createRequestId();
  console.info(`[intake:${id}] handler_reached=true method=${request.method ?? 'missing'}`);
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsed = parseBody(request, intakeRequestSchema);
  if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
  try {
    const extraction = await extract(parsed.data.text, { requestId: id });
    return response.status(200).json({ extraction, followUps: selectIntakeFollowUps(extraction) });
  } catch (error) {
    if (error instanceof ProviderUnavailableError) {
      console.error(`[intake:${id}] fallback_invoked=true category=${error.category}`);
      return response.status(503).json({ error: 'Automatic intake is unavailable. Continue with the guided questions.' });
    }
    if (error instanceof ExtractionFailedError) {
      console.error(`[intake:${id}] fallback_invoked=true category=${error.category}`);
      return response.status(503).json({ error: 'intake_extraction_unavailable' });
    }
    console.error(`[intake:${id}] fallback_invoked=true category=unknown`);
    return response.status(500).json({ error: 'Unable to complete the request' });
  }
};

export default createIntakeHandler();
