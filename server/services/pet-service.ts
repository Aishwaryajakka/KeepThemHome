import { and, asc, eq } from 'drizzle-orm';
import { getDatabase, getTransactionalDatabase } from '../db.js';
import { pets } from '../db/schema.js';
import type { CreatePetInput, UpdatePetInput } from '../validation/pet.js';

export const createOwnedPet = async (userId: string, input: CreatePetInput) => {
  const db = getDatabase();
  const [existing] = await db.select().from(pets).where(and(
    eq(pets.userId, userId), eq(pets.name, input.name), eq(pets.type, input.type),
  )).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(pets).values({ ...input, userId }).returning();
  return created;
};

export const listOwnedPets = (userId: string) => getDatabase().select().from(pets)
  .where(eq(pets.userId, userId)).orderBy(asc(pets.createdAt));

export const updateOwnedPet = async (userId: string, petId: string, input: UpdatePetInput) => {
  const [updated] = await getDatabase().update(pets).set({ ...input, updatedAt: new Date() })
    .where(and(eq(pets.id, petId), eq(pets.userId, userId))).returning();
  return updated;
};

export const deleteOwnedPet = async (userId: string, petId: string) => getTransactionalDatabase().transaction(async (tx) => {
  const [owned] = await tx.select().from(pets).where(and(eq(pets.id, petId), eq(pets.userId, userId))).limit(1);
  if (!owned) return undefined;
  const [deleted] = await tx.delete(pets).where(and(eq(pets.id, petId), eq(pets.userId, userId))).returning();
  return deleted;
});
