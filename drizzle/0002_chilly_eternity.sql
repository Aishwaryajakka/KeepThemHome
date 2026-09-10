CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_subject_unique" UNIQUE("auth_subject")
);
--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "pet_id" uuid;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pets_user_id_idx" ON "pets" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cases_user_id_idx" ON "cases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cases_pet_id_idx" ON "cases" USING btree ("pet_id");