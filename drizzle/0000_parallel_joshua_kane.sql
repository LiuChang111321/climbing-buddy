CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"climber_id" uuid NOT NULL,
	"gym_id" integer NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "climbers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nickname" text NOT NULL,
	"avatar" text NOT NULL,
	"signature" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gyms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gyms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_climber_id_climbers_id_fk" FOREIGN KEY ("climber_id") REFERENCES "public"."climbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_date_idx" ON "bookings" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_unique_idx" ON "bookings" USING btree ("climber_id","date","time");