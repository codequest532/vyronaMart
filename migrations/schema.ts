import { pgTable, serial, integer, text, timestamp, jsonb, boolean, unique, foreignKey, varchar, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const achievements = pgTable("achievements", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: text().notNull(),
	earnedAt: timestamp("earned_at", { mode: 'string' }).defaultNow(),
});

export const cartItems = pgTable("cart_items", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().default(1).notNull(),
	roomId: integer("room_id"),
});

export const gameScores = pgTable("game_scores", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	gameType: text("game_type").notNull(),
	score: integer().notNull(),
	coinsEarned: integer("coins_earned").notNull(),
	playedAt: timestamp("played_at", { mode: 'string' }).defaultNow(),
});

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	totalAmount: integer("total_amount").notNull(),
	status: text().default('pending').notNull(),
	module: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const shoppingRooms = pgTable("shopping_rooms", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	creatorId: integer("creator_id").notNull(),
	currentGame: text("current_game"),
	totalCart: integer("total_cart").default(0),
	memberCount: integer("member_count").default(1),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const stores = pgTable("stores", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	address: text(),
	latitude: text(),
	longitude: text(),
	isOpen: boolean("is_open").default(true),
	rating: integer().default(0),
	reviewCount: integer("review_count").default(0),
});

export const otpVerifications = pgTable("otp_verifications", {
	id: serial().primaryKey().notNull(),
	identifier: text().notNull(),
	otp: text().notNull(),
	type: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	verified: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	vyronaCoins: integer("vyrona_coins").default(0).notNull(),
	xp: integer().default(0).notNull(),
	level: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	mobile: text(),
	role: text().default('customer').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const groupMembers = pgTable("group_members", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	userId: integer("user_id").notNull(),
	role: text().default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
});

export const groupMessages = pgTable("group_messages", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	userId: integer("user_id").notNull(),
	message: text().notNull(),
	messageType: text("message_type").default('text'),
	metadata: jsonb(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
});

export const groupWishlists = pgTable("group_wishlists", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	productId: integer("product_id").notNull(),
	addedBy: integer("added_by").notNull(),
	priority: integer().default(1),
	notes: text(),
	addedAt: timestamp("added_at", { mode: 'string' }).defaultNow(),
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: integer().notNull(),
	category: text().notNull(),
	module: text().notNull(),
	imageUrl: text("image_url"),
	storeId: integer("store_id"),
	metadata: jsonb(),
});

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	metadata: jsonb(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const productShares = pgTable("product_shares", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	sharedBy: integer("shared_by").notNull(),
	groupId: integer("group_id"),
	shareType: text("share_type").notNull(),
	message: text(),
	sharedAt: timestamp("shared_at", { mode: 'string' }).defaultNow(),
});

export const instagramAnalytics = pgTable("instagram_analytics", {
	id: serial().primaryKey().notNull(),
	storeId: integer("store_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	impressions: integer().default(0),
	reach: integer().default(0),
	profileViews: integer("profile_views").default(0),
	websiteClicks: integer("website_clicks").default(0),
	ordersCount: integer("orders_count").default(0),
	revenue: integer().default(0),
	topProductId: integer("top_product_id"),
});

export const instagramOrders = pgTable("instagram_orders", {
	id: serial().primaryKey().notNull(),
	buyerId: integer("buyer_id").notNull(),
	storeId: integer("store_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().default(1).notNull(),
	totalAmount: integer("total_amount").notNull(),
	status: text().default('pending').notNull(),
	shippingAddress: jsonb("shipping_address"),
	contactInfo: jsonb("contact_info"),
	orderNotes: text("order_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const instagramProducts = pgTable("instagram_products", {
	id: serial().primaryKey().notNull(),
	storeId: integer("store_id").notNull(),
	instagramMediaId: text("instagram_media_id").notNull(),
	productName: text("product_name").notNull(),
	description: text(),
	price: integer().notNull(),
	currency: text().default('USD'),
	imageUrl: text("image_url"),
	productUrl: text("product_url"),
	isAvailable: boolean("is_available").default(true),
	categoryTag: text("category_tag"),
	hashtags: text().array(),
	likesCount: integer("likes_count"),
	commentsCount: integer("comments_count"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const instagramStores = pgTable("instagram_stores", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	instagramUsername: text("instagram_username").notNull(),
	instagramUserId: text("instagram_user_id"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	storeName: text("store_name"),
	storeDescription: text("store_description"),
	profilePictureUrl: text("profile_picture_url"),
	followersCount: integer("followers_count"),
	connectedAt: timestamp("connected_at", { mode: 'string' }).defaultNow(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
});

export const libraryIntegrationRequests = pgTable("library_integration_requests", {
	id: serial().primaryKey().notNull(),
	sellerId: integer("seller_id").notNull(),
	libraryName: varchar("library_name", { length: 255 }).notNull(),
	libraryType: varchar("library_type", { length: 100 }).notNull(),
	address: text().notNull(),
	contactPerson: varchar("contact_person", { length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	email: varchar({ length: 255 }),
	description: text(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	processedBy: integer("processed_by"),
	adminNotes: text("admin_notes"),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [users.id],
			name: "library_integration_requests_seller_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.processedBy],
			foreignColumns: [users.id],
			name: "library_integration_requests_processed_by_users_id_fk"
		}),
]);

export const shoppingGroups = pgTable("shopping_groups", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	creatorId: integer("creator_id").notNull(),
	isActive: boolean("is_active").default(true),
	maxMembers: integer("max_members").default(10),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const bookLoans = pgTable("book_loans", {
	id: serial().primaryKey().notNull(),
	bookId: integer("book_id").notNull(),
	borrowerId: integer("borrower_id").notNull(),
	libraryId: integer("library_id").notNull(),
	loanDate: timestamp("loan_date", { mode: 'string' }).defaultNow().notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	returnDate: timestamp("return_date", { mode: 'string' }),
	status: varchar({ length: 50 }).default('active').notNull(),
	renewalCount: integer("renewal_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bookId],
			foreignColumns: [physicalBooks.id],
			name: "book_loans_book_id_physical_books_id_fk"
		}),
	foreignKey({
			columns: [table.borrowerId],
			foreignColumns: [users.id],
			name: "book_loans_borrower_id_users_id_fk"
		}),
]);

export const eBooks = pgTable("e_books", {
	id: serial().primaryKey().notNull(),
	sellerId: integer("seller_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	author: varchar({ length: 255 }).notNull(),
	isbn: varchar({ length: 50 }),
	category: varchar({ length: 100 }),
	format: varchar({ length: 50 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileSize: integer("file_size"),
	salePrice: numeric("sale_price", { precision: 10, scale:  2 }),
	rentalPrice: numeric("rental_price", { precision: 10, scale:  2 }),
	description: text(),
	publisher: varchar({ length: 255 }),
	publicationYear: varchar("publication_year", { length: 10 }),
	language: varchar({ length: 50 }).default('English'),
	status: varchar({ length: 50 }).default('active').notNull(),
	downloads: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [users.id],
			name: "e_books_seller_id_users_id_fk"
		}),
]);

export const physicalBooks = pgTable("physical_books", {
	id: serial().primaryKey().notNull(),
	libraryId: integer("library_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	author: varchar({ length: 255 }).notNull(),
	isbn: varchar({ length: 50 }),
	category: varchar({ length: 100 }),
	copies: integer().default(1).notNull(),
	available: integer().default(1).notNull(),
	publisher: varchar({ length: 255 }),
	publicationYear: varchar("publication_year", { length: 10 }),
	language: varchar({ length: 50 }).default('English'),
	location: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const groupBuyCampaigns = pgTable("group_buy_campaigns", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	createdBy: integer("created_by").notNull(),
	shoppingGroupId: integer("shopping_group_id"),
	minParticipants: integer("min_participants").default(5).notNull(),
	maxParticipants: integer("max_participants").default(100).notNull(),
	targetQuantity: integer("target_quantity").notNull(),
	currentQuantity: integer("current_quantity").default(0).notNull(),
	status: varchar({ length: 50 }).default('active').notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).defaultNow().notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "group_buy_campaigns_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.shoppingGroupId],
			foreignColumns: [shoppingGroups.id],
			name: "group_buy_campaigns_shopping_group_id_shopping_groups_id_fk"
		}),
]);

export const groupBuyCampaignProducts = pgTable("group_buy_campaign_products", {
	id: serial().primaryKey().notNull(),
	campaignId: integer("campaign_id").notNull(),
	groupBuyProductId: integer("group_buy_product_id").notNull(),
	targetQuantity: integer("target_quantity").notNull(),
	currentQuantity: integer("current_quantity").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [groupBuyCampaigns.id],
			name: "group_buy_campaign_products_campaign_id_group_buy_campaigns_id_"
		}),
	foreignKey({
			columns: [table.groupBuyProductId],
			foreignColumns: [groupBuyProducts.id],
			name: "group_buy_campaign_products_group_buy_product_id_group_buy_prod"
		}),
]);

export const groupBuyProducts = pgTable("group_buy_products", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	sellerId: integer("seller_id").notNull(),
	isApproved: boolean("is_approved").default(false).notNull(),
	minQuantity: integer("min_quantity").default(10).notNull(),
	groupBuyPrice: integer("group_buy_price").notNull(),
	originalPrice: integer("original_price").notNull(),
	discountPercentage: integer("discount_percentage").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	approvedBy: integer("approved_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "group_buy_products_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [users.id],
			name: "group_buy_products_seller_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "group_buy_products_approved_by_users_id_fk"
		}),
]);

export const groupBuyOrders = pgTable("group_buy_orders", {
	id: serial().primaryKey().notNull(),
	campaignId: integer("campaign_id").notNull(),
	userId: integer("user_id").notNull(),
	productDetails: jsonb("product_details").notNull(),
	totalAmount: integer("total_amount").notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	shippingAddress: jsonb("shipping_address"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [groupBuyCampaigns.id],
			name: "group_buy_orders_campaign_id_group_buy_campaigns_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_buy_orders_user_id_users_id_fk"
		}),
]);

export const groupBuyParticipants = pgTable("group_buy_participants", {
	id: serial().primaryKey().notNull(),
	campaignId: integer("campaign_id").notNull(),
	userId: integer("user_id").notNull(),
	quantity: integer().notNull(),
	totalAmount: integer("total_amount").notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [groupBuyCampaigns.id],
			name: "group_buy_participants_campaign_id_group_buy_campaigns_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_buy_participants_user_id_users_id_fk"
		}),
]);
