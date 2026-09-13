import { z } from 'zod';
import { intakeSystemPrompt } from './prompt.js';
import { intakeExtractionSchema, intakeJsonSchema, type IntakeExtraction } from '../validation/intake.js';

export type IntakeFailureCategory =
  | 'missing_api_key' | 'missing_model' | 'invalid_model' | 'authentication' | 'rate_limit'
  | 'upstream_5xx' | 'timeout' | 'network' | 'invalid_request' | 'malformed_provider_response'
  | 'json_parse' | 'schema_validation' | 'unknown';

export class ProviderUnavailableError extends Error {
  constructor(message: string, public readonly category: IntakeFailureCategory = 'unknown') { super(message); this.name = 'ProviderUnavailableError'; }
}
export class ExtractionFailedError extends Error {
  constructor(message: string, public readonly category: IntakeFailureCategory = 'unknown', public readonly providerStatus?: number) {
    super(message); this.name = 'ExtractionFailedError';
  }
}

const safeProviderErrorCode = async (response: Response) => {
  try {
    const body = await response.clone().json() as { error?: { code?: unknown; type?: unknown } };
    const value = body.error?.code ?? body.error?.type;
    return typeof value === 'string' || typeof value === 'number' ? String(value).slice(0, 80) : 'unavailable';
  } catch { return 'unavailable'; }
};

const groqResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
}).passthrough();

const parseProviderJson = (content: string) => {
  const trimmed = content.trim();
  const unfenced = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```[\s\S]*$/, '')
    : trimmed;
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start < 0 || end < start) throw new SyntaxError('No JSON object found');
  return JSON.parse(unfenced.slice(start, end + 1)) as unknown;
};

const categoryForStatus = (status: number, code: string): IntakeFailureCategory => {
  const normalized = code.toLowerCase();
  if (status === 401 || status === 403) return 'authentication';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'upstream_5xx';
  if (status === 404 || normalized.includes('model')) return 'invalid_model';
  if (status >= 400 && status < 500) return 'invalid_request';
  return 'unknown';
};
const isTransient = (category: IntakeFailureCategory) => ['rate_limit', 'upstream_5xx', 'timeout', 'network'].includes(category);
const defaultSleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export const extractIntake = async (
  text: string,
  options: { fetch?: typeof fetch; apiKey?: string; model?: string; requestId?: string; timeoutMs?: number; sleep?: (milliseconds: number) => Promise<void> } = {},
): Promise<IntakeExtraction> => {
  const apiKey = options.apiKey ?? process.env.GROQ_API_KEY;
  const model = options.model ?? process.env.GROQ_MODEL;
  const requestId = options.requestId ?? 'untracked';
  console.info(`[intake:${requestId}] model=${model || 'missing'} api_key_present=${Boolean(apiKey)}`);
  if (!apiKey) throw new ProviderUnavailableError('Natural-language intake API key is not configured', 'missing_api_key');
  if (!model) throw new ProviderUnavailableError('Natural-language intake model is not configured', 'missing_model');

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000);
    let response: Response;
    try {
      response = await (options.fetch ?? fetch)('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model, temperature: 0,
          messages: [{ role: 'system', content: intakeSystemPrompt }, { role: 'user', content: text }],
          response_format: { type: 'json_schema', json_schema: { name: 'pet_crisis_extraction', strict: true, schema: intakeJsonSchema } },
        }),
      });
    } catch (error) {
      const category: IntakeFailureCategory = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError') ? 'timeout' : 'network';
      clearTimeout(timeout);
      console.error(`[intake:${requestId}] provider_status=unavailable category=${category} timeout=${category === 'timeout'} attempt=${attempt}`);
      if (attempt === 1) { await (options.sleep ?? defaultSleep)(150); continue; }
      throw new ExtractionFailedError('The extraction provider could not be reached', category);
    }
    clearTimeout(timeout);
    if (!response.ok) {
      const code = await safeProviderErrorCode(response);
      const category = categoryForStatus(response.status, code);
      console.error(`[intake:${requestId}] provider_status=${response.status} category=${category} provider_code=${code} timeout=false attempt=${attempt}`);
      if (attempt === 1 && isTransient(category)) { await (options.sleep ?? defaultSleep)(150); continue; }
      throw new ExtractionFailedError('The extraction provider rejected the request', category, response.status);
    }

    let envelope: z.infer<typeof groqResponseSchema>;
    try {
      envelope = groqResponseSchema.parse(await response.json());
    } catch {
      console.error(`[intake:${requestId}] parser_failure=malformed_provider_response`);
      throw new ExtractionFailedError('The extraction response envelope was invalid', 'malformed_provider_response');
    }
    let decoded: unknown;
    try {
      decoded = parseProviderJson(envelope.choices[0].message.content);
    } catch {
      console.error(`[intake:${requestId}] parser_failure=json_parse`);
      throw new ExtractionFailedError('The extraction response JSON was invalid', 'json_parse');
    }
    const validated = intakeExtractionSchema.safeParse(decoded);
    if (!validated.success) {
      console.error(`[intake:${requestId}] parser_failure=schema_validation`);
      throw new ExtractionFailedError('The extraction response schema was invalid', 'schema_validation');
    }
    console.info(`[intake:${requestId}] provider_status=${response.status} extraction_success=true attempts=${attempt}`);
    return validated.data;
  }
  throw new ExtractionFailedError('The extraction failed', 'unknown');
};
