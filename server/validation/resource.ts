import { z } from 'zod';

export const resourceCategorySchema = z.enum([
  'housing-search',
  'financial-support',
  'temporary-care',
  'general-support',
]);

export const resourceQuerySchema = z.object({
  category: resourceCategorySchema.optional(),
}).strict();
