import { z } from 'zod';
import { intakeSystemPrompt } from './prompt.js';
import { intakeExtractionSchema, intakeJsonSchema, type IntakeExtraction } from '../validation/intake.js';

export class ProviderUnavailableError extends Error {}
export class ExtractionFailedError extends Error {}

const safeProviderErrorCode = async (response: Response) => {
  try {
    const body = await response.clone().json() as { error?: { code?: unknown; type?: unknown } };
    const value = body.error?.code ?? body.error?.type;
    return typeof value === 'string' || typeof value === 'number' ? String(value).slice(0, 80) : 'unavailable';
  } catch {
    return 'unavailable';
  }
};

const groqResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string() }),
  })).min(1),
}).passthrough();

export const extractIntake = async (
  text: string,
  options: { fetch?: typeof fetch; apiKey?: string; model?: string } = {},
): Promise<IntakeExtraction> => {
  const apiKey = options.apiKey ?? process.env.GROQ_API_KEY;
  const model = options.model ?? process.env.GROQ_MODEL;
  console.info(`[intake] groq_key_present=${Boolean(apiKey)} model_present=${Boolean(model)}`);
  if (!apiKey || !model) throw new ProviderUnavailableError('Natural-language intake is not configured');

  let response: Response;
  try {
    response = await (options.fetch ?? fetch)('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: intakeSystemPrompt },
          { role: 'user', content: text },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'pet_crisis_extraction', strict: true, schema: intakeJsonSchema },
        },
      }),
    });
  } catch (error) {
    console.error(`[intake] failure_stage=provider_connection error_name=${error instanceof Error ? error.name : 'UnknownError'}`);
    throw new ExtractionFailedError('The extraction provider could not be reached');
  }
  if (!response.ok) {
    console.error(`[intake] failure_stage=provider_response status=${response.status} error_code=${await safeProviderErrorCode(response)}`);
    throw new ExtractionFailedError('The extraction provider rejected the request');
  }

  try {
    const envelope = groqResponseSchema.parse(await response.json());
    return intakeExtractionSchema.parse(JSON.parse(envelope.choices[0].message.content));
  } catch (error) {
    console.error(`[intake] failure_stage=response_validation error_name=${error instanceof Error ? error.name : 'UnknownError'}`);
    throw new ExtractionFailedError('The extraction response was invalid');
  }
};
