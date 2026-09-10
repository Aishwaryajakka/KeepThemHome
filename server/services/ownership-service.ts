import { and, eq } from 'drizzle-orm';
import { getDatabase } from '../db';
import { cases, pets } from '../db/schema';
import type { VercelRequest } from '@vercel/node';
import { resolveAppUser } from './auth-service';

export const getOwnedPet = async (userId: string, petId: string) => {
  const [pet] = await getDatabase().select().from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, userId))).limit(1);
  return pet;
};

export const getOwnedCase = async (userId: string, caseId: string) => {
  const [caseRecord] = await getDatabase().select().from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId))).limit(1);
  return caseRecord;
};

export const resolveOwnedCase = async (request: VercelRequest, caseId: string) => {
  const user = await resolveAppUser(request);
  if (!user) return { status: 'unauthenticated' as const };
  const caseRecord = await getOwnedCase(user.id, caseId);
  return caseRecord
    ? { status: 'ok' as const, user, caseRecord }
    : { status: 'not_found' as const };
};

export type OwnedCaseResolver = typeof resolveOwnedCase;
