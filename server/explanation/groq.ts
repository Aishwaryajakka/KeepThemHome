import { ExtractionFailedError, ProviderUnavailableError } from '../intake/groq.js';
import { explanationJsonSchema, explanationOutputSchema, type ExplanationOutput } from '../validation/explanation.js';
import type { GroundedExplanationPayload } from './domain.js';
import { isGroundedExplanation } from './grounding.js';
import { explanationSystemPrompt } from './prompt.js';

export const generateGroundedExplanation = async (
  payload: GroundedExplanationPayload,
  options: { fetch?: typeof fetch; apiKey?: string; model?: string } = {},
): Promise<ExplanationOutput> => {
  const apiKey = options.apiKey ?? process.env.GROQ_API_KEY;
  const model = options.model ?? process.env.GROQ_MODEL;
  if (!apiKey || !model) throw new ProviderUnavailableError('Grounded explanation is not configured');
  let response: Response;
  try {
    response = await (options.fetch ?? fetch)('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: explanationSystemPrompt },
          { role: 'user', content: `Explain this trusted JSON data only:\n${JSON.stringify(payload)}` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'grounded_path_explanation', strict: true, schema: explanationJsonSchema },
        },
      }),
    });
  } catch {
    throw new ExtractionFailedError('The explanation provider could not be reached');
  }
  if (!response.ok) throw new ExtractionFailedError('The explanation provider rejected the request');
  try {
    const raw = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = raw.choices?.[0]?.message?.content;
    const output = explanationOutputSchema.parse(JSON.parse(content ?? ''));
    if (!isGroundedExplanation(output, payload)) throw new Error('Ungrounded output');
    return output;
  } catch {
    throw new ExtractionFailedError('The explanation response was invalid');
  }
};
