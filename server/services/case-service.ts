import { desc, eq, sql } from 'drizzle-orm';
import { getDatabase } from '../db';
import { caseFactors, cases, outcomes } from '../db/schema';
import type {
  CreateCaseInput,
  CreateFactorsInput,
  CreateOutcomeInput,
  UpdateCaseInput,
} from '../validation/case';

export const createCase = async (input: CreateCaseInput) => {
  const [created] = await getDatabase().insert(cases).values(input).returning();
  return created;
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
