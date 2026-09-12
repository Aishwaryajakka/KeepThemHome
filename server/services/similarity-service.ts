import { and, cosineDistance, eq, ne, or, sql } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import { caseActions, caseFactors, caseSimilarityProfiles, cases, outcomes } from '../db/schema.js';
import { generateRetentionPaths } from './path-service.js';
import { CANONICAL_SIMILARITY_VERSION, canonicalSimilarityText, structuredEmbedding, urgencyBucket } from '../similarity/canonical.js';
import { qualitativeSimilarity, similarityReasons, similarityScore } from '../similarity/rank.js';
import { syntheticSimilarityCases } from '../similarity/synthetic.js';
import type { SimilarCaseDto, SimilarityOutcomeCategory, StructuredSimilarityInput } from '../similarity/domain.js';

const outcomeCategory = (status?: string): SimilarityOutcomeCategory => {
  const value = status?.toLowerCase() ?? '';
  if (value.includes('keeping') || value.includes('staying')) return 'KEEPING_PET';
  if (value.includes('rehom')) return 'REHOMING_SUPPORT_NEEDED';
  if (value.includes('trying') || value.includes('active')) return 'STILL_TRYING';
  return 'UNKNOWN';
};

const inputFromProfile = (profile: typeof caseSimilarityProfiles.$inferSelect): StructuredSimilarityInput => ({
  petType: profile.petType, primaryFactor: profile.primaryFactor, contributingFactors: profile.contributingFactors,
  urgencyBucket: 'unknown', constraintKeys: profile.constraintKeys, pathKey: profile.pathKey,
  blockerCategories: profile.blockerCategories, interventionCategories: profile.interventionCategories,
  outcomeCategory: outcomeCategory(profile.outcomeCategory),
});

const profileValues = (input: StructuredSimilarityInput) => ({
  canonicalVersion: CANONICAL_SIMILARITY_VERSION, structuredSignature: canonicalSimilarityText(input),
  petType: input.petType, primaryFactor: input.primaryFactor, contributingFactors: input.contributingFactors,
  constraintKeys: input.constraintKeys, pathKey: input.pathKey, blockerCategories: input.blockerCategories,
  interventionCategories: input.interventionCategories, outcomeCategory: input.outcomeCategory,
  embedding: structuredEmbedding(input), updatedAt: new Date(),
});

export const isSimilarityCandidate = (sourceProfileId: string, candidate: { id: string; isSynthetic: boolean; sharingEligible: boolean }) =>
  candidate.id !== sourceProfileId && (candidate.isSynthetic || candidate.sharingEligible);

export const ensureSyntheticSimilarityProfiles = async () => {
  for (const example of syntheticSimilarityCases) {
    await getDatabase().insert(caseSimilarityProfiles).values({ ...profileValues(example.input), syntheticKey: example.key, isSynthetic: true, sharingEligible: true })
      .onConflictDoUpdate({ target: caseSimilarityProfiles.syntheticKey, set: profileValues(example.input) });
  }
};

export const refreshCaseSimilarityProfile = async (caseId: string) => {
  const input = await buildCaseSimilarityInput(caseId);
  if (!input) return undefined;
  const db = getDatabase();
  const [caseRecord] = await db.select({ sharing: cases.similaritySharingEnabled }).from(cases).where(eq(cases.id, caseId)).limit(1);
  const values = profileValues(input);
  const [profile] = await db.insert(caseSimilarityProfiles).values({ ...values, caseId, sharingEligible: caseRecord?.sharing ?? false })
    .onConflictDoUpdate({ target: caseSimilarityProfiles.caseId, set: { ...values, sharingEligible: caseRecord?.sharing ?? false } }).returning();
  return profile;
};

export const buildCaseSimilarityInput = async (caseId: string): Promise<StructuredSimilarityInput | undefined> => {
  const db = getDatabase();
  const [record] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!record) return undefined;
  const factors = await db.select().from(caseFactors).where(eq(caseFactors.caseId, caseId));
  const actions = await db.select().from(caseActions).where(eq(caseActions.caseId, caseId));
  const [latestOutcome] = await db.select().from(outcomes).where(eq(outcomes.caseId, caseId)).orderBy(sql`${outcomes.createdAt} desc`).limit(1);
  const paths = await generateRetentionPaths(caseId);
  const selectedPath = paths?.paths.find(({ key }) => actions.some((action) => action.pathKey === key)) ?? paths?.paths[0];
  const factorValue = (key: string) => factors.find(({ factorType }) => factorType === key)?.factorValue;
  const contributors = factors.filter(({ factorType, factorValue: value }) => value && (factorType.startsWith('contributing_') || factorType === 'behavior_contributor')).map(({ factorValue: value }) => value!);
  if (factorValue('cost_constraint')) contributors.push('cost');
  return {
    petType: record.petType, primaryFactor: record.primaryBarrier ?? factorValue('primary_barrier') ?? 'unknown',
    contributingFactors: contributors, urgencyBucket: urgencyBucket(record.urgency),
    constraintKeys: selectedPath?.blockers.map(({ field }) => field) ?? [], pathKey: selectedPath?.key ?? 'unknown',
    blockerCategories: Array.from(new Set([record.primaryBarrier ?? 'unknown', ...contributors])),
    interventionCategories: actions.map(({ interventionKey }) => interventionKey).filter((value): value is string => Boolean(value)),
    outcomeCategory: outcomeCategory(latestOutcome?.status),
  };
};

export const findSimilarCases = async (caseId: string, limit = 3): Promise<SimilarCaseDto[]> => {
  const input = await buildCaseSimilarityInput(caseId);
  if (!input) return [];
  await ensureSyntheticSimilarityProfiles();
  const db = getDatabase();
  const source = await refreshCaseSimilarityProfile(caseId);
  if (!source) return [];
  const distance = cosineDistance(caseSimilarityProfiles.embedding, source.embedding);
  const candidates = await db.select().from(caseSimilarityProfiles).where(and(
    ne(caseSimilarityProfiles.id, source.id), eq(caseSimilarityProfiles.petType, input.petType),
    eq(caseSimilarityProfiles.primaryFactor, input.primaryFactor),
    or(eq(caseSimilarityProfiles.isSynthetic, true), eq(caseSimilarityProfiles.sharingEligible, true)),
  )).orderBy(distance).limit(20);
  return candidates.filter((profile) => isSimilarityCandidate(source.id, profile)).map((profile) => {
    const candidate = inputFromProfile(profile); const score = similarityScore(input, candidate);
    return { profile, candidate, score };
  }).sort((a, b) => b.score - a.score).slice(0, limit).map(({ profile, candidate, score }) => ({
    id: profile.id, provenance: profile.isSynthetic ? 'synthetic_example' : 'anonymous_shared_case',
    similarityLabel: qualitativeSimilarity(score), petType: profile.petType,
    factors: [profile.primaryFactor, ...profile.contributingFactors], pathKey: profile.pathKey,
    actions: profile.interventionCategories, outcomeCategory: outcomeCategory(profile.outcomeCategory),
    reasons: similarityReasons(input, candidate),
  }));
};
