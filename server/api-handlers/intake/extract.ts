import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody } from '../../http.js';
import { ExtractionFailedError, extractIntake, ProviderUnavailableError } from '../../intake/groq.js';
import { selectIntakeFollowUps } from '../../intake/follow-ups.js';
import { intakeRequestSchema } from '../../validation/intake.js';

export const createIntakeHandler = (extract = extractIntake) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  console.info(`[intake] route_reached=true method=${request.method ?? 'missing'} handler=intake_extract`);
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsed = parseBody(request, intakeRequestSchema);
  if (!parsed.success) return response.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
  try {
    const extraction = await extract(parsed.data.text);
    return response.status(200).json({ extraction, followUps: selectIntakeFollowUps(extraction) });
  } catch (error) {
    if (error instanceof ProviderUnavailableError) {
      return response.status(503).json({ error: 'Automatic intake is unavailable. Continue with the guided questions.' });
    }
    if (error instanceof ExtractionFailedError) {
      return response.status(503).json({ error: 'intake_extraction_unavailable' });
    }
    return response.status(500).json({ error: 'Unable to complete the request' });
  }
};

export default createIntakeHandler();
