-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"earned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"room_id" integer
);
--> statement-breakpoint
CREATE TABLE "game_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_type" text NOT NULL,
	"score" integer NOT NULL,
	"coins_earned" integer NOT NULL,
	"played_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"module" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shopping_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"creator_id" integer NOT NULL,
	"current_game" text,
	"total_cart" integer DEFAULT 0,
	"member_count" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"address" text,
	"latitude" text,
	"longitude" text,
	"is_open" boolean DEFAULT true,
	"rating" integer DEFAULT 0,
	"review_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"otp" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"vyrona_coins" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"mobile" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"metadata" jsonb,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_wishlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"added_by" integer NOT NULL,
	"priority" integer DEFAULT 1,
	"notes" text,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"category" text NOT NULL,
	"module" text NOT NULL,
	"image_url" text,
	"store_id" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"shared_by" integer NOT NULL,
	"group_id" integer,
	"share_type" text NOT NULL,
	"message" text,
	"shared_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instagram_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"impressions" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"profile_views" integer DEFAULT 0,
	"website_clicks" integer DEFAULT 0,
	"orders_count" integer DEFAULT 0,
	"revenue" integer DEFAULT 0,
	"top_product_id" integer
);
--> statement-breakpoint
CREATE TABLE "instagram_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" integer NOT NULL,
	"store_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"shipping_address" jsonb,
	"contact_info" jsonb,
	"order_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instagram_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"instagram_media_id" text NOT NULL,
	"product_name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'USD',
	"image_url" text,
	"product_url" text,
	"is_available" boolean DEFAULT true,
	"category_tag" text,
	"hashtags" text[],
	"likes_count" integer,
	"comments_count" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instagram_stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"instagram_username" text NOT NULL,
	"instagram_user_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"store_name" text,
	"store_description" text,
	"profile_picture_url" text,
	"followers_count" integer,
	"connected_at" timestamp DEFAULT now(),
	"last_sync_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "library_integration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"library_name" varchar(255) NOT NULL,
	"library_type" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"contact_person" varchar(255) NOT NULL,
	"phone" varchar(50),
	"email" varchar(255),
	"description" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processed_by" integer,
	"admin_notes" text
);
--> statement-breakpoint
CREATE TABLE "shopping_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"creator_id" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"max_members" integer DEFAULT 10,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "book_loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"borrower_id" integer NOT NULL,
	"library_id" integer NOT NULL,
	"loan_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp NOT NULL,
	"return_date" timestamp,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"renewal_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "e_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"isbn" varchar(50),
	"category" varchar(100),
	"format" varchar(50) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"sale_price" numeric(10, 2),
	"rental_price" numeric(10, 2),
	"description" text,
	"publisher" varchar(255),
	"publication_year" varchar(10),
	"language" varchar(50) DEFAULT 'English',
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"downloads" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "physical_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"library_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"isbn" varchar(50),
	"category" varchar(100),
	"copies" integer DEFAULT 1 NOT NULL,
	"available" integer DEFAULT 1 NOT NULL,
	"publisher" varchar(255),
	"publication_year" varchar(10),
	"language" varchar(50) DEFAULT 'English',
	"location" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_buy_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"shopping_group_id" integer,
	"min_participants" integer DEFAULT 5 NOT NULL,
	"max_participants" integer DEFAULT 100 NOT NULL,
	"target_quantity" integer NOT NULL,
	"current_quantity" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_buy_campaign_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"group_buy_product_id" integer NOT NULL,
	"target_quantity" integer NOT NULL,
	"current_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_buy_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"min_quantity" integer DEFAULT 10 NOT NULL,
	"group_buy_price" integer NOT NULL,
	"original_price" integer NOT NULL,
	"discount_percentage" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"approved_at" timestamp,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_buy_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"product_details" jsonb NOT NULL,
	"total_amount" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"shipping_address" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "group_buy_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "library_integration_requests" ADD CONSTRAINT "library_integration_requests_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_integration_requests" ADD CONSTRAINT "library_integration_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_loans" ADD CONSTRAINT "book_loans_book_id_physical_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."physical_books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_loans" ADD CONSTRAINT "book_loans_borrower_id_users_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "e_books" ADD CONSTRAINT "e_books_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_campaigns" ADD CONSTRAINT "group_buy_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_campaigns" ADD CONSTRAINT "group_buy_campaigns_shopping_group_id_shopping_groups_id_fk" FOREIGN KEY ("shopping_group_id") REFERENCES "public"."shopping_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_campaign_products" ADD CONSTRAINT "group_buy_campaign_products_campaign_id_group_buy_campaigns_id_" FOREIGN KEY ("campaign_id") REFERENCES "public"."group_buy_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_campaign_products" ADD CONSTRAINT "group_buy_campaign_products_group_buy_product_id_group_buy_prod" FOREIGN KEY ("group_buy_product_id") REFERENCES "public"."group_buy_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_products" ADD CONSTRAINT "group_buy_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_products" ADD CONSTRAINT "group_buy_products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_products" ADD CONSTRAINT "group_buy_products_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_orders" ADD CONSTRAINT "group_buy_orders_campaign_id_group_buy_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."group_buy_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_orders" ADD CONSTRAINT "group_buy_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_participants" ADD CONSTRAINT "group_buy_participants_campaign_id_group_buy_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."group_buy_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_buy_participants" ADD CONSTRAINT "group_buy_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
*/