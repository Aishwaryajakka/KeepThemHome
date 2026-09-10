import { z } from 'zod';
import { intakeSystemPrompt } from './prompt';
import { intakeExtractionSchema, intakeJsonSchema, type IntakeExtraction } from '../validation/intake';

export class ProviderUnavailableError extends Error {}
export class ExtractionFailedError extends Error {}

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
  } catch {
    throw new ExtractionFailedError('The extraction provider could not be reached');
  }
  if (!response.ok) throw new ExtractionFailedError('The extraction provider rejected the request');

  try {
    const envelope = groqResponseSchema.parse(await response.json());
    return intakeExtractionSchema.parse(JSON.parse(envelope.choices[0].message.content));
  } catch {
    throw new ExtractionFailedError('The extraction response was invalid');
  }
};
