import { and, asc, eq } from 'drizzle-orm';
import { getDatabase } from '../db';
import { resources } from '../db/schema';

export type ResourceCategory = 'housing-search' | 'financial-support' | 'temporary-care' | 'general-support';

export const listVerifiedResources = async (category?: ResourceCategory) => {
  const visibility = and(eq(resources.active, true), eq(resources.verificationStatus, 'verified'));
  return getDatabase().select().from(resources)
    .where(category ? and(visibility, eq(resources.category, category)) : visibility)
    .orderBy(asc(resources.createdAt), asc(resources.slug));
};
