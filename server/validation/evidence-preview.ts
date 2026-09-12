import { z } from 'zod';
import { goalSchema, primaryBarrierSchema, urgencySchema } from './case.js';

export const evidencePreviewSchema = z.object({
  pathKey: z.string().trim().min(1).max(100).regex(/^[a-z0-9_]+$/),
  primaryBarrier: primaryBarrierSchema,
  situation: z.string().max(200).nullable(),
  urgency: urgencySchema.nullable(),
  goal: goalSchema.nullable(),
  behaviorContributor: z.boolean(),
  costConstraint: z.string().max(200).nullable(),
  contributingBarriers: z.array(primaryBarrierSchema).max(6),
}).strict();
