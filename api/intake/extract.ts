import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody } from '../../server/http';
import { ExtractionFailedError, extractIntake, ProviderUnavailableError } from '../../server/intake/groq';
import { selectIntakeFollowUps } from '../../server/intake/follow-ups';
import { intakeRequestSchema } from '../../server/validation/intake';

export const createIntakeHandler = (extract = extractIntake) => async (
  request: VercelRequest,
  response: VercelResponse,
) => {
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
      return response.status(502).json({ error: 'We could not interpret that automatically. Continue with the guided questions.' });
    }
    return response.status(500).json({ error: 'Unable to complete the request' });
  }
};

export default createIntakeHandler();
