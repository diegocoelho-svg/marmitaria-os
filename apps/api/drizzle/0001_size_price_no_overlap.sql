CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "size_prices" ADD CONSTRAINT "size_prices_no_overlap" EXCLUDE USING gist ("size" WITH =, tstzrange("valid_from", "valid_to", '[)') WITH &&);
