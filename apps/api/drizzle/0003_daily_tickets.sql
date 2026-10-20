CREATE TABLE "daily_ticket_counters" (
	"business_date" date PRIMARY KEY NOT NULL,
	"last_ticket" bigint NOT NULL,
	CONSTRAINT "daily_ticket_counters_last_ticket_positive" CHECK ("daily_ticket_counters"."last_ticket" >= 1)
);
--> statement-breakpoint
ALTER TABLE "order_item_adjustments" ADD CONSTRAINT "order_item_adjustments_adjustment_id_adjustments_id_fk" FOREIGN KEY ("adjustment_id") REFERENCES "public"."adjustments"("id") ON DELETE no action ON UPDATE no action;