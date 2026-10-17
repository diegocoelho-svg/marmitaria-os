CREATE TYPE "public"."order_origin" AS ENUM('counter', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('received', 'preparing', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TABLE "daily_menu_dishes" (
	"daily_menu_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"dish_id" uuid NOT NULL,
	CONSTRAINT "daily_menu_dishes_daily_menu_id_position_pk" PRIMARY KEY("daily_menu_id","position"),
	CONSTRAINT "daily_menu_dishes_daily_menu_dish_unique" UNIQUE("daily_menu_id","dish_id"),
	CONSTRAINT "daily_menu_dishes_position_non_negative" CHECK ("daily_menu_dishes"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "daily_menus" (
	"id" uuid PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"source_menu_id" uuid NOT NULL,
	CONSTRAINT "daily_menus_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_dishes" (
	"menu_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"dish_id" uuid NOT NULL,
	CONSTRAINT "menu_dishes_menu_id_position_pk" PRIMARY KEY("menu_id","position"),
	CONSTRAINT "menu_dishes_menu_dish_unique" UNIQUE("menu_id","dish_id"),
	CONSTRAINT "menu_dishes_position_non_negative" CHECK ("menu_dishes"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_item_adjustments" (
	"order_id" uuid NOT NULL,
	"item_position" integer NOT NULL,
	"position" integer NOT NULL,
	"adjustment_id" uuid NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "order_item_adjustments_order_id_item_position_position_pk" PRIMARY KEY("order_id","item_position","position"),
	CONSTRAINT "order_item_adjustments_item_adjustment_unique" UNIQUE("order_id","item_position","adjustment_id"),
	CONSTRAINT "order_item_adjustments_position_non_negative" CHECK ("order_item_adjustments"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"order_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"dish_id" uuid NOT NULL,
	"dish_name" text NOT NULL,
	"size" "size" NOT NULL,
	"unit_price_cents" bigint NOT NULL,
	"quantity" bigint NOT NULL,
	"note" text,
	CONSTRAINT "order_items_order_id_position_pk" PRIMARY KEY("order_id","position"),
	CONSTRAINT "order_items_position_non_negative" CHECK ("order_items"."position" >= 0),
	CONSTRAINT "order_items_unit_price_cents_positive" CHECK ("order_items"."unit_price_cents" > 0),
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_date" date NOT NULL,
	"ticket" bigint NOT NULL,
	"origin" "order_origin" NOT NULL,
	"customer_name" text,
	"status" "order_status" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "orders_business_date_ticket_unique" UNIQUE("business_date","ticket"),
	CONSTRAINT "orders_ticket_positive" CHECK ("orders"."ticket" >= 1)
);
--> statement-breakpoint
CREATE TABLE "size_prices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"size" "size" NOT NULL,
	"price_cents" bigint NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "size_prices_price_cents_positive" CHECK ("size_prices"."price_cents" > 0),
	CONSTRAINT "size_prices_valid_period" CHECK ("size_prices"."valid_to" IS NULL OR "size_prices"."valid_to" > "size_prices"."valid_from")
);
--> statement-breakpoint
ALTER TABLE "daily_menu_dishes" ADD CONSTRAINT "daily_menu_dishes_daily_menu_id_daily_menus_id_fk" FOREIGN KEY ("daily_menu_id") REFERENCES "public"."daily_menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_menu_dishes" ADD CONSTRAINT "daily_menu_dishes_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_menus" ADD CONSTRAINT "daily_menus_source_menu_id_menus_id_fk" FOREIGN KEY ("source_menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_adjustments" ADD CONSTRAINT "order_item_adjustments_item_fk" FOREIGN KEY ("order_id","item_position") REFERENCES "public"."order_items"("order_id","position") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "menus_active_name_key_unique" ON "menus" USING btree ("name_key") WHERE "menus"."archived_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "size_prices_open_size_unique" ON "size_prices" USING btree ("size") WHERE "size_prices"."valid_to" is null;