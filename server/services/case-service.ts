import { and, desc, eq, sql } from 'drizzle-orm';
import { getDatabase } from '../db';
import { caseFactors, cases, outcomes, pets } from '../db/schema';
import type {
  CreateCaseInput,
  CreateFactorsInput,
  CreateOutcomeInput,
  UpdateCaseInput,
  CreateOwnedCaseInput,
} from '../validation/case';

export const createCase = async (input: CreateCaseInput) => {
  const [created] = await getDatabase().insert(cases).values(input).returning();
  return created;
};

export const createOwnedCase = async (userId: string, pet: typeof pets.$inferSelect, input: CreateOwnedCaseInput) => {
  const db = getDatabase();
  const [existing] = await db.select().from(cases).where(and(
    eq(cases.userId, userId), eq(cases.petId, pet.id), eq(cases.currentStatus, 'active'),
  )).orderBy(desc(cases.updatedAt)).limit(1);
  if (existing) return existing;
  const { petId: _petId, ...caseInput } = input;
  const [created] = await db.insert(cases).values({
    ...caseInput, userId, petId: pet.id, petName: pet.name, petType: pet.type,
  }).returning();
  return created;
};

export const listOwnedCases = async (userId: string) => {
  const db = getDatabase();
  const records = await db.select({ caseRecord: cases, pet: pets }).from(cases)
    .innerJoin(pets, eq(cases.petId, pets.id))
    .where(eq(cases.userId, userId)).orderBy(desc(cases.updatedAt));
  const seenPets = new Set<string>();
  const latestPerPet = records.filter(({ pet }) => {
    if (seenPets.has(pet.id)) return false;
    seenPets.add(pet.id);
    return true;
  });
  return Promise.all(latestPerPet.map(async ({ caseRecord, pet }) => {
    const factors = await getCaseFactors(caseRecord.id);
    const latestOutcomes = await getOutcomes(caseRecord.id);
    return { case: caseRecord, pet, factors, latestOutcome: latestOutcomes[0] ?? null };
  }));
};

export const updateOwnedCase = async (userId: string, id: string, input: UpdateCaseInput) => {
  const [updated] = await getDatabase().update(cases).set({ ...input, updatedAt: new Date() })
    .where(and(eq(cases.id, id), eq(cases.userId, userId))).returning();
  return updated;
};

export const getCase = async (id: string) => {
  const [record] = await getDatabase().select().from(cases).where(eq(cases.id, id)).limit(1);
  return record;
};

export const updateCase = async (id: string, input: UpdateCaseInput) => {
  const [updated] = await getDatabase()
    .update(cases)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(cases.id, id))
    .returning();
  return updated;
};

export const addCaseFactors = async (caseId: string, input: CreateFactorsInput) => {
  return getDatabase().insert(caseFactors).values(
    input.factors.map((factor) => ({ ...factor, caseId })),
  ).onConflictDoUpdate({
    target: [caseFactors.caseId, caseFactors.factorType, caseFactors.source],
    set: {
      factorValue: sql`excluded.factor_value`,
      role: sql`excluded.role`,
      confidence: sql`excluded.confidence`,
    },
  }).returning();
};

export const getCaseFactors = async (caseId: string) =>
  getDatabase().select().from(caseFactors)
    .where(eq(caseFactors.caseId, caseId))
    .orderBy(desc(caseFactors.createdAt));

export const addOutcome = async (caseId: string, input: CreateOutcomeInput) => {
  const [created] = await getDatabase().insert(outcomes).values({ ...input, caseId })
    .onConflictDoUpdate({
      target: [outcomes.caseId, outcomes.status],
      set: { unresolvedBarrier: input.unresolvedBarrier, notes: input.notes },
    })
    .returning();
  return created;
};

export const getOutcomes = async (caseId: string) =>
  getDatabase().select().from(outcomes)
    .where(eq(outcomes.caseId, caseId))
    .orderBy(desc(outcomes.createdAt));
