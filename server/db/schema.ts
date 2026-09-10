import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authSubject: text('auth_subject').notNull().unique(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pets = pgTable('pets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('pets_user_id_idx').on(table.userId),
]);

export const cases = pgTable('cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  petName: text('pet_name').notNull(),
  petType: text('pet_type').notNull(),
  primaryBarrier: text('primary_barrier'),
  urgency: text('urgency'),
  goal: text('goal'),
  currentStatus: text('current_status').notNull().default('active'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('cases_current_status_idx').on(table.currentStatus),
  index('cases_updated_at_idx').on(table.updatedAt),
  index('cases_user_id_idx').on(table.userId),
  index('cases_pet_id_idx').on(table.petId),
]);

export const caseFactors = pgTable('case_factors', {
  id: uuid('id').defaultRandom().primaryKey(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  factorType: text('factor_type').notNull(),
  factorValue: text('factor_value'),
  role: text('role').notNull(),
  source: text('source').notNull(),
  confidence: numeric('confidence', { precision: 4, scale: 3, mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('case_factors_case_id_idx').on(table.caseId),
  index('case_factors_type_idx').on(table.factorType),
  uniqueIndex('case_factors_case_type_source_uidx').on(table.caseId, table.factorType, table.source),
]);

export const outcomes = pgTable('outcomes', {
  id: uuid('id').defaultRandom().primaryKey(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  unresolvedBarrier: text('unresolved_barrier'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('outcomes_case_id_idx').on(table.caseId),
  index('outcomes_status_idx').on(table.status),
  uniqueIndex('outcomes_case_status_uidx').on(table.caseId, table.status),
]);

export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  geographicScope: text('geographic_scope').notNull(),
  eligibilitySummary: text('eligibility_summary').notNull(),
  costSummary: text('cost_summary').notNull(),
  url: text('url').notNull(),
  sourceName: text('source_name').notNull(),
  verifiedAt: text('verified_at').notNull(),
  verificationStatus: text('verification_status').notNull().default('verified'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('resources_category_idx').on(table.category),
  index('resources_visibility_idx').on(table.active, table.verificationStatus),
]);

export const interventions = pgTable('interventions', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  supportedBarriers: jsonb('supported_barriers').$type<string[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const interventionResources = pgTable('intervention_resources', {
  interventionId: uuid('intervention_id').notNull().references(() => interventions.id, { onDelete: 'cascade' }),
  resourceId: uuid('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  relevanceWeight: integer('relevance_weight').notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.interventionId, table.resourceId] }),
  index('intervention_resources_resource_idx').on(table.resourceId),
]);

export const recommendations = pgTable('recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  interventionKey: text('intervention_key').notNull(),
  rank: integer('rank').notNull(),
  score: integer('score'),
  reasonCodes: jsonb('reason_codes').$type<string[]>().notNull().default([]),
  generatedBy: text('generated_by').notNull().default('rules'),
  factsFingerprint: text('facts_fingerprint').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('recommendations_case_id_idx').on(table.caseId),
  uniqueIndex('recommendations_case_facts_intervention_uidx')
    .on(table.caseId, table.factsFingerprint, table.interventionKey),
]);

export type CaseRecord = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
export type CaseFactorRecord = typeof caseFactors.$inferSelect;
export type NewCaseFactor = typeof caseFactors.$inferInsert;
export type OutcomeRecord = typeof outcomes.$inferSelect;
export type NewOutcome = typeof outcomes.$inferInsert;
export type ResourceRecord = typeof resources.$inferSelect;
export type InterventionRecord = typeof interventions.$inferSelect;
export type RecommendationRecord = typeof recommendations.$inferSelect;
export type UserRecord = typeof users.$inferSelect;
export type PetRecord = typeof pets.$inferSelect;
