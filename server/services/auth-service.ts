import { sql } from 'drizzle-orm';
import type { VercelRequest } from '@vercel/node';
import { getDatabase } from '../db.js';
import { users } from '../db/schema.js';
import { getAuthenticatedIdentity, type IdentityResolver } from '../auth/clerk.js';

export const getOrCreateAppUser = async (
  identity: { subject: string; email?: string },
  db: ReturnType<typeof getDatabase> = getDatabase(),
) => {
  const [user] = await db.insert(users).values({
    authSubject: identity.subject,
    email: identity.email ?? null,
  }).onConflictDoUpdate({
    target: users.authSubject,
    set: {
      email: sql`coalesce(excluded.email, ${users.email})`,
      updatedAt: new Date(),
    },
  }).returning();
  return user;
};

export type AppUserResolver = (request: VercelRequest) => ReturnType<typeof resolveAppUser>;

export const resolveAppUser = async (
  request: VercelRequest,
  resolveIdentity: IdentityResolver = getAuthenticatedIdentity,
) => {
  const identity = await resolveIdentity(request);
  return identity ? getOrCreateAppUser(identity) : null;
};
