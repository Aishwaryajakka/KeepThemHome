import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const petTypeSchema = z.enum(['dog', 'cat', 'other']);
export const primaryBarrierSchema = z.enum(['housing', 'behavior', 'cost', 'medical', 'temporary_crisis', 'time_capacity', 'circumstances']);
export const urgencySchema = z.enum(['Today or within 48 hours', 'This week', 'Within a month', 'I’m planning ahead']);
export const goalSchema = z.enum(['Stay where I am', 'Move', 'Either could work']);
export const caseStatusSchema = z.enum(['ACTIVE', 'KEEPING_PET', 'REHOMING_SUPPORT', 'ARCHIVED', 'active', 'keeping', 'still_trying', 'rehoming_help', 'closed']);
export const factorRoleSchema = z.enum(['primary', 'contributing', 'constraint']);
export const factorSourceSchema = z.enum(['structured', 'ai']);
export const outcomeStatusSchema = z.enum(['KEEPING_PET', 'STILL_TRYING', 'REHOMING_SUPPORT_NEEDED']);
export const helpfulFactorSchema = z.enum(['HOUSING_RESOLUTION', 'BEHAVIOR_SUPPORT', 'FINANCIAL_SUPPORT', 'VETERINARY_SUPPORT', 'TEMPORARY_CARE', 'TRUSTED_NETWORK', 'ROUTINE_CHANGE', 'OTHER']);

export const createCaseSchema = z.object({
  petName: z.string().trim().min(1).max(100),
  petType: petTypeSchema,
  primaryBarrier: primaryBarrierSchema.nullable().optional(),
  urgency: urgencySchema.nullable().optional(),
  goal: goalSchema.nullable().optional(),
  currentStatus: caseStatusSchema.optional(),
}).strict();

export const createOwnedCaseSchema = z.object({
  petId: uuidSchema,
  primaryBarrier: primaryBarrierSchema.nullable().optional(),
  urgency: urgencySchema.nullable().optional(),
  goal: goalSchema.nullable().optional(),
  currentStatus: caseStatusSchema.optional(),
}).strict();

export const updateCaseSchema = z.object({
  petName: z.string().trim().min(1).max(100).optional(),
  petType: petTypeSchema.optional(),
  primaryBarrier: primaryBarrierSchema.nullable().optional(),
  urgency: urgencySchema.nullable().optional(),
  goal: goalSchema.nullable().optional(),
  currentStatus: caseStatusSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const factorSchema = z.object({
  factorType: z.string().trim().min(1).max(100),
  factorValue: z.string().trim().max(500).nullable().optional(),
  role: factorRoleSchema,
  source: factorSourceSchema,
  confidence: z.number().min(0).max(1).nullable().optional(),
}).strict();

const factorListSchema = z.array(factorSchema).min(1).max(40);

export const createFactorsSchema = z.object({
  factors: factorListSchema,
}).strict().refine(
  ({ factors }) => new Set(factors.map(({ factorType, source }) => `${source}:${factorType}`)).size === factors.length,
  'Duplicate factor keys are not allowed',
);

export const saveCaseSchema = z.object({
  caseId: uuidSchema.optional(),
  pet: z.object({
    name: z.string().trim().min(1).max(100),
    type: petTypeSchema,
  }).strict(),
  case: createOwnedCaseSchema.omit({ petId: true }),
  factors: factorListSchema,
}).strict();

export const createOutcomeSchema = z.object({
  status: outcomeStatusSchema,
  unresolvedBarrier: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  helpfulFactors: z.array(helpfulFactorSchema).max(8).optional(),
}).strict();

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type CreateOwnedCaseInput = z.infer<typeof createOwnedCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CreateFactorsInput = z.infer<typeof createFactorsSchema>;
export type SaveCaseInput = z.infer<typeof saveCaseSchema>;
export type CreateOutcomeInput = z.infer<typeof createOutcomeSchema>;
