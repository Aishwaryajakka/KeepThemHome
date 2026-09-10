CREATE TABLE "case_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"factor_type" text NOT NULL,
	"factor_value" text,
	"role" text NOT NULL,
	"source" text NOT NULL,
	"confidence" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_name" text NOT NULL,
	"pet_type" text NOT NULL,
	"primary_barrier" text,
	"urgency" text,
	"goal" text,
	"current_status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"status" text NOT NULL,
	"unresolved_barrier" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_factors" ADD CONSTRAINT "case_factors_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_factors_case_id_idx" ON "case_factors" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_factors_type_idx" ON "case_factors" USING btree ("factor_type");--> statement-breakpoint
CREATE UNIQUE INDEX "case_factors_case_type_source_uidx" ON "case_factors" USING btree ("case_id","factor_type","source");--> statement-breakpoint
CREATE INDEX "cases_current_status_idx" ON "cases" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "cases_updated_at_idx" ON "cases" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "outcomes_case_id_idx" ON "outcomes" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "outcomes_status_idx" ON "outcomes" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "outcomes_case_status_uidx" ON "outcomes" USING btree ("case_id","status");