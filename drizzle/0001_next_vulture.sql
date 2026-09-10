CREATE TABLE "intervention_resources" (
	"intervention_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"relevance_weight" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "intervention_resources_intervention_id_resource_id_pk" PRIMARY KEY("intervention_id","resource_id")
);
--> statement-breakpoint
CREATE TABLE "interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"supported_barriers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interventions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"intervention_key" text NOT NULL,
	"rank" integer NOT NULL,
	"score" integer,
	"reason_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_by" text DEFAULT 'rules' NOT NULL,
	"facts_fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"geographic_scope" text NOT NULL,
	"eligibility_summary" text NOT NULL,
	"cost_summary" text NOT NULL,
	"url" text NOT NULL,
	"source_name" text NOT NULL,
	"verified_at" text NOT NULL,
	"verification_status" text DEFAULT 'verified' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "intervention_resources" ADD CONSTRAINT "intervention_resources_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention_resources" ADD CONSTRAINT "intervention_resources_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "intervention_resources_resource_idx" ON "intervention_resources" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "recommendations_case_id_idx" ON "recommendations" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recommendations_case_facts_intervention_uidx" ON "recommendations" USING btree ("case_id","facts_fingerprint","intervention_key");--> statement-breakpoint
CREATE INDEX "resources_category_idx" ON "resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "resources_visibility_idx" ON "resources" USING btree ("active","verification_status");