import { z } from 'zod';
import { goalSchema, petTypeSchema, primaryBarrierSchema, urgencySchema } from './case.js';

export const MAX_INTAKE_TEXT_LENGTH = 3000;

export const housingSituationSchema = z.enum([
  'My landlord or property says pets aren’t allowed',
  'I can’t afford the pet deposit or fee',
  'I’m moving and struggling to find pet-friendly housing',
  'There’s a breed or size restriction',
  'I’m temporarily between homes',
]);

export const behaviorConcernSchema = z.enum([
  'Barking or excessive noise',
  'Destructive behavior',
  'House-training problems',
  'Separation-related behavior',
  'Leash or walking problems',
  'Conflict with another animal',
  'Growling, biting, or aggression',
  'Difficulty around other dogs',
  'Difficulty around cats or other animals',
  'Difficulty around children or people',
  'Resource guarding',
  'Escape or roaming',
  'Fear or anxiety',
  'High energy or exercise needs',
]);

export const behaviorSeriousnessSchema = z.enum([
  'Frustrating, but manageable',
  'It’s affecting our daily life',
  'I’m seriously considering surrender',
  'There’s an immediate safety concern',
]);

export const behaviorTriedSchema = z.enum([
  'Nothing yet',
  'Online advice or videos',
  'Training at home',
  'Group training classes',
  'A professional trainer',
  'A veterinary consultation',
]);

export const behaviorBarrierSchema = z.enum([
  'Cost',
  'Availability',
  'Transportation',
  'I don’t know who to contact',
  'I’ve already tried getting help',
  'Nothing — I just need a plan',
]);

export const intakeRequestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_INTAKE_TEXT_LENGTH),
}).strict();

export const intakeExtractionSchema = z.object({
  petName: z.string().trim().min(1).max(100).nullable(),
  petType: petTypeSchema.nullable(),
  primaryBarrier: primaryBarrierSchema.nullable(),
  contributingBarriers: z.array(primaryBarrierSchema).max(6)
    .refine((values) => new Set(values).size === values.length, 'Contributing barriers must be unique'),
  housingSituation: housingSituationSchema.nullable(),
  behaviorConcern: behaviorConcernSchema.nullable(),
  behaviorSeriousness: behaviorSeriousnessSchema.nullable(),
  behaviorAlreadyTried: behaviorTriedSchema.nullable(),
  behaviorHelpBarrier: behaviorBarrierSchema.nullable(),
  costConstraint: z.string().trim().min(1).max(200).nullable(),
  urgency: urgencySchema.nullable(),
  goal: goalSchema.nullable(),
}).strict().superRefine((value, context) => {
  if (value.primaryBarrier && value.contributingBarriers.includes(value.primaryBarrier)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['contributingBarriers'], message: 'Primary barrier cannot also be contributing' });
  }
  const barriers = new Set([value.primaryBarrier, ...value.contributingBarriers]);
  if (value.housingSituation && !barriers.has('housing')) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['housingSituation'], message: 'Housing situation requires a housing barrier' });
  }
  if ([value.behaviorConcern, value.behaviorSeriousness, value.behaviorAlreadyTried, value.behaviorHelpBarrier].some(Boolean)
    && !barriers.has('behavior')) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['behaviorConcern'], message: 'Behavior facts require a behavior barrier' });
  }
  if (value.costConstraint && !barriers.has('cost')) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['costConstraint'], message: 'Cost constraint requires a cost barrier' });
  }
});

export type IntakeExtraction = z.infer<typeof intakeExtractionSchema>;

const nullableEnum = (values: readonly string[]) => ({
  type: ['string', 'null'],
  enum: [...values, null],
});

export const intakeJsonSchema = {
  type: 'object',
  properties: {
    petName: { type: ['string', 'null'], minLength: 1, maxLength: 100 },
    petType: nullableEnum(petTypeSchema.options),
    primaryBarrier: nullableEnum(primaryBarrierSchema.options),
    contributingBarriers: { type: 'array', items: { type: 'string', enum: primaryBarrierSchema.options }, maxItems: 6 },
    housingSituation: nullableEnum(housingSituationSchema.options),
    behaviorConcern: nullableEnum(behaviorConcernSchema.options),
    behaviorSeriousness: nullableEnum(behaviorSeriousnessSchema.options),
    behaviorAlreadyTried: nullableEnum(behaviorTriedSchema.options),
    behaviorHelpBarrier: nullableEnum(behaviorBarrierSchema.options),
    costConstraint: { type: ['string', 'null'], minLength: 1, maxLength: 200 },
    urgency: nullableEnum(urgencySchema.options),
    goal: nullableEnum(goalSchema.options),
  },
  required: [
    'petName', 'petType', 'primaryBarrier', 'contributingBarriers', 'housingSituation',
    'behaviorConcern', 'behaviorSeriousness', 'behaviorAlreadyTried', 'behaviorHelpBarrier',
    'costConstraint', 'urgency', 'goal',
  ],
  additionalProperties: false,
} as const;
