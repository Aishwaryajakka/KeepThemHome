import { z } from 'zod';
import { pathKeySchema, supportedChangeCodeSchema } from './counterfactual';

export const explanationModeSchema = z.enum([
  'PATH_SUMMARY',
  'BLOCKER_EXPLANATION',
  'UNLOCK_EXPLANATION',
  'ACTION_PLAN_SUMMARY',
]);

export const explanationRequestSchema = z.object({
  pathKey: pathKeySchema,
  mode: explanationModeSchema,
  appliedChanges: z.array(supportedChangeCodeSchema).max(7).optional(),
}).strict().refine(
  ({ appliedChanges = [] }) => new Set(appliedChanges).size === appliedChanges.length,
  'Duplicate hypothetical changes are not allowed',
);

export const explanationOutputSchema = z.object({
  status: z.enum(['FEASIBLE', 'CONDITIONAL', 'BLOCKED']),
  isHypothetical: z.boolean(),
  headline: z.string().trim().min(1).max(100),
  summary: z.string().trim().min(1).max(500),
  why: z.string().trim().min(1).max(500),
  nextStep: z.string().trim().min(1).max(300),
  resourceNames: z.array(z.string().trim().min(1).max(150)).max(10),
}).strict();

export type ExplanationMode = z.infer<typeof explanationModeSchema>;
export type ExplanationOutput = z.infer<typeof explanationOutputSchema>;

export const explanationJsonSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['FEASIBLE', 'CONDITIONAL', 'BLOCKED'] },
    isHypothetical: { type: 'boolean' },
    headline: { type: 'string', minLength: 1, maxLength: 100 },
    summary: { type: 'string', minLength: 1, maxLength: 500 },
    why: { type: 'string', minLength: 1, maxLength: 500 },
    nextStep: { type: 'string', minLength: 1, maxLength: 300 },
    resourceNames: { type: 'array', items: { type: 'string', minLength: 1, maxLength: 150 }, maxItems: 10, uniqueItems: true },
  },
  required: ['status', 'isHypothetical', 'headline', 'summary', 'why', 'nextStep', 'resourceNames'],
  additionalProperties: false,
} as const;
