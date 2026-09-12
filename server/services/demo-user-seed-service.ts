import { createClerkClient } from '@clerk/backend';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getTransactionalDatabase } from '../db.js';
import { caseFactors, cases, pets, users } from '../db/schema.js';

export interface DemoClerkUser {
  id: string;
  username: string | null;
}

export const resolveClerkUserByUsername = async (
  username: string,
  secretKey = process.env.CLERK_SECRET_KEY,
  getUsers?: (username: string) => Promise<DemoClerkUser[]>,
) => {
  if (!secretKey && !getUsers) throw new Error('CLERK_SECRET_KEY is not configured');
  const matches = getUsers
    ? await getUsers(username)
    : (await createClerkClient({ secretKey: secretKey! }).users.getUserList({ username: [username], limit: 10 })).data;
  const exact = matches.filter((user) => user.username?.toLowerCase() === username.toLowerCase());
  if (exact.length !== 1) throw new Error(`Expected exactly one Clerk user named ${username}; found ${exact.length}`);
  return exact[0];
};

export const seedDemoUserRecords = async (authSubject: string) => {
  return getTransactionalDatabase().transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ authSubject }).onConflictDoUpdate({
      target: users.authSubject,
      set: { updatedAt: new Date() },
    }).returning();

    let [pet] = await tx.select().from(pets).where(and(
      eq(pets.userId, user.id), eq(pets.name, 'Luna'), eq(pets.type, 'dog'),
    )).limit(1);
    let petCreated = false;
    if (!pet) {
      [pet] = await tx.insert(pets).values({ userId: user.id, name: 'Luna', type: 'dog' }).returning();
      petCreated = true;
    }

    let [caseRecord] = await tx.select().from(cases).where(and(
      eq(cases.userId, user.id), eq(cases.petId, pet.id),
      inArray(cases.currentStatus, ['ACTIVE', 'active', 'STILL_TRYING', 'still_trying']),
    )).limit(1);
    let caseCreated = false;
    if (!caseRecord) {
      [caseRecord] = await tx.insert(cases).values({
        userId: user.id,
        petId: pet.id,
        petName: pet.name,
        petType: pet.type,
        primaryBarrier: 'housing',
        urgency: 'This week',
        goal: null,
        currentStatus: 'ACTIVE',
      }).returning();
      caseCreated = true;
    }

    const factors = [
      { factorType: 'primary_barrier', factorValue: 'housing', role: 'primary' },
      { factorType: 'housing_situation', factorValue: 'My landlord or property says pets aren’t allowed', role: 'primary' },
      { factorType: 'urgency', factorValue: 'This week', role: 'constraint' },
      { factorType: 'behavior_contributor', factorValue: 'behavior', role: 'contributing' },
      { factorType: 'behavior_concern', factorValue: 'Barking or excessive noise', role: 'contributing' },
      { factorType: 'cost_constraint', factorValue: 'Cannot afford a trainer', role: 'constraint' },
    ];
    await tx.insert(caseFactors).values(factors.map((factor) => ({
      ...factor, caseId: caseRecord.id, source: 'structured',
    }))).onConflictDoUpdate({
      target: [caseFactors.caseId, caseFactors.factorType, caseFactors.source],
      set: { factorValue: sql`excluded.factor_value`, role: sql`excluded.role` },
    });

    return { userId: user.id, petId: pet.id, caseId: caseRecord.id, petCreated, caseCreated, factorCount: factors.length };
  });
};

export const seedDemoUser = async (username = 'demouser') => {
  const clerkUser = await resolveClerkUserByUsername(username);
  return seedDemoUserRecords(clerkUser.id);
};
