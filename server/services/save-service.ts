import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { getTransactionalDatabase } from '../db.js';
import { caseFactors, cases, pets } from '../db/schema.js';
import type { SaveCaseInput } from '../validation/case.js';

export const saveOwnedAssessment = async (userId: string, input: SaveCaseInput) => getTransactionalDatabase().transaction(async (tx) => {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);

  let pet: typeof pets.$inferSelect | undefined;
  let caseRecord: typeof cases.$inferSelect | undefined;

  if (input.caseId) {
    [caseRecord] = await tx.select().from(cases).where(and(eq(cases.id, input.caseId), eq(cases.userId, userId))).limit(1);
    if (!caseRecord?.petId) return undefined;
    [pet] = await tx.select().from(pets).where(and(eq(pets.id, caseRecord.petId), eq(pets.userId, userId))).limit(1);
    if (!pet) return undefined;
  } else {
    [pet] = await tx.select().from(pets).where(and(
      eq(pets.userId, userId), eq(pets.name, input.pet.name), eq(pets.type, input.pet.type),
    )).orderBy(desc(pets.updatedAt)).limit(1);
    if (!pet) [pet] = await tx.insert(pets).values({ userId, ...input.pet }).returning();

    [caseRecord] = await tx.select().from(cases).where(and(
      eq(cases.userId, userId), eq(cases.petId, pet.id),
      inArray(cases.currentStatus, ['ACTIVE', 'active', 'STILL_TRYING', 'still_trying']),
    )).orderBy(desc(cases.updatedAt)).limit(1);
  }

  const caseValues = {
    ...input.case,
    userId,
    petId: pet.id,
    petName: pet.name,
    petType: pet.type,
    updatedAt: new Date(),
  };
  if (caseRecord) {
    [caseRecord] = await tx.update(cases).set(caseValues)
      .where(and(eq(cases.id, caseRecord.id), eq(cases.userId, userId))).returning();
  } else {
    [caseRecord] = await tx.insert(cases).values(caseValues).returning();
  }
  if (!caseRecord) throw new Error('Case persistence failed');

  const factors = await tx.insert(caseFactors).values(
    input.factors.map((factor) => ({ ...factor, caseId: caseRecord.id })),
  ).onConflictDoUpdate({
    target: [caseFactors.caseId, caseFactors.factorType, caseFactors.source],
    set: {
      factorValue: sql`excluded.factor_value`, role: sql`excluded.role`, confidence: sql`excluded.confidence`,
    },
  }).returning();

  return { case: caseRecord, pet, factors };
});
