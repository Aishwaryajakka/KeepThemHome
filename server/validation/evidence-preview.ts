import { z } from 'zod';
import { goalSchema, primaryBarrierSchema, urgencySchema } from './case';
import { pathKeySchema } from './counterfactual';

export const evidencePreviewSchema = z.object({
  pathKey: pathKeySchema,
  primaryBarrier: primaryBarrierSchema,
  situation: z.string().max(200).nullable(),
  urgency: urgencySchema.nullable(),
  goal: goalSchema.nullable(),
  behaviorContributor: z.boolean(),
  costConstraint: z.string().max(200).nullable(),
  contributingBarriers: z.array(primaryBarrierSchema).max(6),
}).strict();
