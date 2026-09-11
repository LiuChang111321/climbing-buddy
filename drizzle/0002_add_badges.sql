ALTER TABLE "climbers" ADD COLUMN "cancel_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"climber_id" uuid NOT NULL,
	"badge_id" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_climber_id_climbers_id_fk" FOREIGN KEY ("climber_id") REFERENCES "public"."climbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "badges_unique_idx" ON "badges" USING btree ("climber_id","badge_id");
