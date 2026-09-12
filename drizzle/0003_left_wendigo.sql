CREATE TABLE "case_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"path_key" text NOT NULL,
	"action_key" text NOT NULL,
	"intervention_key" text,
	"related_fact" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"not_possible_reason" text,
	"result_note" text,
	"outcome_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "case_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"action_id" uuid,
	"event_type" text NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_actions" ADD CONSTRAINT "case_actions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_action_id_case_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."case_actions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_actions_case_id_idx" ON "case_actions" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_actions_status_idx" ON "case_actions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "case_actions_case_path_action_uidx" ON "case_actions" USING btree ("case_id","path_key","action_key");--> statement-breakpoint
CREATE INDEX "case_events_case_id_idx" ON "case_events" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_events_created_at_idx" ON "case_events" USING btree ("created_at");