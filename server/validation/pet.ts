import { z } from 'zod';
import { petTypeSchema } from './case.js';

export const createPetSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: petTypeSchema,
}).strict();

export const updatePetSchema = createPetSchema.partial().strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
