ALTER TABLE "outcomes" ADD COLUMN "helpful_factors" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "outcomes" SET "status" = CASE "status" WHEN 'keeping' THEN 'KEEPING_PET' WHEN 'still_trying' THEN 'STILL_TRYING' WHEN 'rehoming_help' THEN 'REHOMING_SUPPORT_NEEDED' ELSE "status" END;--> statement-breakpoint
UPDATE "cases" SET "current_status" = CASE "current_status" WHEN 'active' THEN 'ACTIVE' WHEN 'still_trying' THEN 'ACTIVE' WHEN 'keeping' THEN 'KEEPING_PET' WHEN 'rehoming_help' THEN 'REHOMING_SUPPORT' WHEN 'closed' THEN 'ARCHIVED' ELSE "current_status" END;--> statement-breakpoint
ALTER TABLE "cases" ALTER COLUMN "current_status" SET DEFAULT 'ACTIVE';
