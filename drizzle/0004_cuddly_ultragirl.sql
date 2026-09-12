CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "case_similarity_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"synthetic_key" text,
	"is_synthetic" boolean DEFAULT false NOT NULL,
	"sharing_eligible" boolean DEFAULT false NOT NULL,
	"canonical_version" text NOT NULL,
	"structured_signature" text NOT NULL,
	"pet_type" text NOT NULL,
	"primary_factor" text NOT NULL,
	"contributing_factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"constraint_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"path_key" text NOT NULL,
	"blocker_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"intervention_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"outcome_category" text DEFAULT 'UNKNOWN' NOT NULL,
	"embedding" vector(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_similarity_profiles_case_id_unique" UNIQUE("case_id"),
	CONSTRAINT "case_similarity_profiles_synthetic_key_unique" UNIQUE("synthetic_key")
);
--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "similarity_sharing_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "case_similarity_profiles" ADD CONSTRAINT "case_similarity_profiles_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_similarity_profiles_eligibility_idx" ON "case_similarity_profiles" USING btree ("sharing_eligible","is_synthetic");--> statement-breakpoint
CREATE INDEX "case_similarity_profiles_pet_factor_idx" ON "case_similarity_profiles" USING btree ("pet_type","primary_factor");--> statement-breakpoint
CREATE INDEX "case_similarity_profiles_embedding_idx" ON "case_similarity_profiles" USING hnsw ("embedding" vector_cosine_ops);
