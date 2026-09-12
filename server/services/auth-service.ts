import { eq, sql } from 'drizzle-orm';
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
  if (process.env.NODE_ENV === 'development') console.info(`[auth] token verified: ${identity ? 'yes' : 'no'}`);
  const user = identity ? await getOrCreateAppUser(identity) : null;
  if (process.env.NODE_ENV === 'development' && identity) console.info('[auth] DB operation: success');
  if (process.env.NODE_ENV === 'development') console.info(`[auth] internal user resolved: ${user ? 'yes' : 'no'}`);
  return user;
};

export interface AppUserDiagnostics {
  lookupStarted: () => void;
  lookupFinished: (success: boolean) => void;
  createStarted: (started: boolean) => void;
  createFinished: (success: boolean) => void;
}

export const resolveOrCreateAppUser = async (
  identity: { subject: string; email?: string },
  diagnostics: AppUserDiagnostics,
  db: ReturnType<typeof getDatabase> = getDatabase(),
) => {
  diagnostics.lookupStarted();
  const [existing] = await db.select().from(users).where(eq(users.authSubject, identity.subject)).limit(1);
  diagnostics.lookupFinished(true);
  if (existing) {
    diagnostics.createStarted(false);
    diagnostics.createFinished(false);
    return existing;
  }
  diagnostics.createStarted(true);
  const created = await getOrCreateAppUser(identity, db);
  diagnostics.createFinished(Boolean(created));
  return created;
};
