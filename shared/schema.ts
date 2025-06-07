import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  mobile: text("mobile"),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // 'customer', 'seller', 'admin'
  vyronaCoins: integer("vyrona_coins").notNull().default(0),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(), // email or mobile
  otp: text("otp").notNull(),
  type: text("type").notNull(), // 'email' or 'mobile' or 'password_reset'
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  category: text("category").notNull(),
  module: text("module").notNull(), // 'social', 'space', 'read', 'mall'
  imageUrl: text("image_url"),
  storeId: integer("store_id"),
  metadata: jsonb("metadata"), // for flexible data like book authors, rental periods, etc.
  enableIndividualBuy: boolean("enable_individual_buy").default(true),
  enableGroupBuy: boolean("enable_group_buy").default(false),
  groupBuyMinQuantity: integer("group_buy_min_quantity").default(4),
  groupBuyDiscount: integer("group_buy_discount").default(0), // percentage discount for group buy
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'kirana', 'fashion', 'electronics', 'lifestyle', 'mall', 'library'
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  isOpen: boolean("is_open").default(true),
  rating: integer("rating").default(0), // out of 500 (5.00 stars)
  reviewCount: integer("review_count").default(0),
});

export const shoppingRooms = pgTable("shopping_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull(),
  isActive: boolean("is_active").default(true),
  currentGame: text("current_game"),
  totalCart: integer("total_cart").default(0),
  maxMembers: integer("max_members").default(10),
  roomCode: text("room_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  roomId: integer("room_id"), // null for individual cart, set for room cart
  addedAt: timestamp("added_at").defaultNow(),
});

// Group Cart Management
export const groupCarts = pgTable("group_carts", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  productId: integer("product_id").notNull(),
  totalQuantity: integer("total_quantity").notNull().default(0),
  minThreshold: integer("min_threshold").notNull().default(4),
  maxCapacity: integer("max_capacity").default(50),
  targetPrice: integer("target_price"), // target group price in cents
  currentPrice: integer("current_price"), // current calculated price in cents
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // cart expiry for urgency
});

export const groupCartContributions = pgTable("group_cart_contributions", {
  id: serial("id").primaryKey(),
  groupCartId: integer("group_cart_id").notNull(),
  userId: integer("user_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  contributionAmount: integer("contribution_amount").notNull(), // in cents
  deliveryAddress: jsonb("delivery_address"), // user's delivery address
  notes: text("notes"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// VyronaWallet Integration removed duplicate - using the one defined later in the file

// Group Orders and Checkout
export const groupOrders = pgTable("group_orders", {
  id: serial("id").primaryKey(),
  groupCartId: integer("group_cart_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  totalAmount: integer("total_amount").notNull(), // in cents
  totalParticipants: integer("total_participants").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  paymentStatus: text("payment_status").notNull().default("pending"), // 'pending', 'completed', 'failed', 'refunded'
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  estimatedDelivery: timestamp("estimated_delivery"),
});

export const groupOrderContributions = pgTable("group_order_contributions", {
  id: serial("id").primaryKey(),
  groupOrderId: integer("group_order_id").notNull(),
  userId: integer("user_id").notNull(),
  contributionAmount: integer("contribution_amount").notNull(),
  deliveryAddress: jsonb("delivery_address").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  trackingNumber: text("tracking_number"),
  deliveryStatus: text("delivery_status").default("pending"), // 'pending', 'shipped', 'delivered'
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'delivered', 'cancelled'
  module: text("module").notNull(),
  metadata: jsonb("metadata"), // order details, delivery info, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'first_purchase', 'social_shopper', 'game_master', etc.
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameType: text("game_type").notNull(),
  score: integer("score").notNull(),
  coinsEarned: integer("coins_earned").notNull(),
  playedAt: timestamp("played_at").defaultNow(),
});

// VyronaSocial Tables
export const shoppingGroups = pgTable("shopping_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull(),
  isActive: boolean("is_active").default(true),
  maxMembers: integer("max_members").default(10),
  roomCode: text("room_code").unique(),
  totalCart: integer("total_cart").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("member"), // 'creator', 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const groupWishlists = pgTable("group_wishlists", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  productId: integer("product_id").notNull(),
  addedBy: integer("added_by").notNull(),
  priority: integer("priority").default(1), // 1=low, 2=medium, 3=high
  notes: text("notes"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text', 'product_share', 'system'
  metadata: jsonb("metadata"), // for product shares, system messages
  sentAt: timestamp("sent_at").defaultNow(),
});

export const productShares = pgTable("product_shares", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  sharedBy: integer("shared_by").notNull(),
  groupId: integer("group_id"),
  shareType: text("share_type").notNull(), // 'group', 'direct', 'public'
  message: text("message"),
  sharedAt: timestamp("shared_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'group_invite', 'wishlist_add', 'product_share', 'message'
  title: text("title").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // groupId, productId, etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// VyronaWallet Tables
export const vyronaWallets = pgTable("vyrona_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: text("currency").notNull().default("INR"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'credit', 'debit', 'payment', 'refund'
  description: text("description").notNull(),
  transactionId: text("transaction_id"), // for payment gateway reference
  status: text("status").notNull().default("completed"), // 'pending', 'completed', 'failed'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// VyronaInstaShop Tables
export const instagramStores = pgTable("instagram_stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  instagramUsername: text("instagram_username").notNull(),
  instagramUserId: text("instagram_user_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  storeName: text("store_name"),
  storeDescription: text("store_description"),
  profilePictureUrl: text("profile_picture_url"),
  followersCount: integer("followers_count"),
  connectedAt: timestamp("connected_at").defaultNow(),
  lastSyncAt: timestamp("last_sync_at"),
});

export const instagramProducts = pgTable("instagram_products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  instagramMediaId: text("instagram_media_id").notNull(),
  productName: text("product_name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  currency: text("currency").default("INR"),
  imageUrl: text("image_url"),
  productUrl: text("product_url"),
  isAvailable: boolean("is_available").default(true),
  categoryTag: text("category_tag"),
  hashtags: text("hashtags").array(),
  likesCount: integer("likes_count"),
  commentsCount: integer("comments_count"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const instagramOrders = pgTable("instagram_orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull(),
  storeId: integer("store_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalAmount: integer("total_amount").notNull(), // in cents
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  shippingAddress: jsonb("shipping_address"),
  contactInfo: jsonb("contact_info"),
  orderNotes: text("order_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



export const instagramAnalytics = pgTable("instagram_analytics", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  profileViews: integer("profile_views").default(0),
  websiteClicks: integer("website_clicks").default(0),
  ordersCount: integer("orders_count").default(0),
  revenue: integer("revenue").default(0), // in cents
  topProductId: integer("top_product_id"),
});

// VyronaRead Books Tables
export const libraryIntegrationRequests = pgTable("library_integration_requests", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  libraryName: varchar("library_name", { length: 255 }).notNull(),
  libraryType: varchar("library_type", { length: 100 }).notNull(),
  address: text("address").notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  description: text("description"),
  booksListCsv: jsonb("books_list_csv"), // Store parsed CSV data as JSON
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
  adminNotes: text("admin_notes"),
});

export const physicalBooks = pgTable("physical_books", {
  id: serial("id").primaryKey(),
  libraryId: integer("library_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 50 }),
  category: varchar("category", { length: 100 }),
  copies: integer("copies").notNull().default(1),
  available: integer("available").notNull().default(1),
  publisher: varchar("publisher", { length: 255 }),
  publicationYear: varchar("publication_year", { length: 4 }),
  description: text("description"),
  condition: varchar("condition", { length: 50 }).default("good"),
  language: varchar("language", { length: 50 }).default("English"),
  pageCount: integer("page_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eBooks = pgTable("e_books", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 50 }),
  category: varchar("category", { length: 100 }),
  format: varchar("format", { length: 50 }).notNull(), // PDF, EPUB, MOBI
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  rentalPrice: decimal("rental_price", { precision: 10, scale: 2 }),
  description: text("description"),
  publisher: varchar("publisher", { length: 255 }),
  publicationYear: varchar("publication_year", { length: 10 }),
  language: varchar("language", { length: 50 }).default("English"),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookLoans = pgTable("book_loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bookId: integer("book_id").notNull(),
  bookType: varchar("book_type", { length: 20 }).notNull(), // 'physical' or 'ebook'
  loanDate: timestamp("loan_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active', 'returned', 'overdue'
  renewalCount: integer("renewal_count").default(0),
  fineAmount: integer("fine_amount").default(0), // in cents
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// VyronaSocial Group Checkout Tables
export const vyronaSocialWallet = pgTable("vyrona_social_wallet", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  balance: integer("balance").notNull().default(0), // in cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



// Book Rentals with 15-day billing cycle
export const bookRentals = pgTable("book_rentals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  bookId: integer("book_id"), // reference to physical_books or e_books
  bookType: varchar("book_type", { length: 20 }).notNull(), // 'physical' or 'ebook'
  rentalStartDate: timestamp("rental_start_date").defaultNow().notNull(),
  currentBillingCycle: integer("current_billing_cycle").default(1).notNull(),
  nextBillingDate: timestamp("next_billing_date").notNull(),
  rentalPricePerCycle: integer("rental_price_per_cycle").notNull(), // in cents, for 15 days
  totalAmountPaid: integer("total_amount_paid").default(0).notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(), // 'active', 'returned', 'overdue'
  autoRenewal: boolean("auto_renewal").default(true).notNull(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  libraryId: integer("library_id"), // for physical books from libraries
  returnRequestId: integer("return_request_id"), // link to return request if initiated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rental Billing History
export const rentalBillingHistory = pgTable("rental_billing_history", {
  id: serial("id").primaryKey(),
  rentalId: integer("rental_id").notNull().references(() => bookRentals.id),
  billingCycle: integer("billing_cycle").notNull(),
  billingDate: timestamp("billing_date").notNull(),
  amount: integer("amount").notNull(), // in cents
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending").notNull(), // 'pending', 'paid', 'failed'
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Return Requests for rented and borrowed books
export const bookReturnRequests = pgTable("book_return_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rentalId: integer("rental_id").references(() => bookRentals.id), // for rented books
  loanId: integer("loan_id").references(() => bookLoans.id), // for borrowed books
  bookType: varchar("book_type", { length: 20 }).notNull(), // 'rental' or 'loan'
  bookTitle: varchar("book_title", { length: 255 }).notNull(),
  returnReason: text("return_reason"),
  requestDate: timestamp("request_date").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'approved', 'completed', 'rejected'
  sellerId: integer("seller_id").references(() => users.id),
  libraryId: integer("library_id"),
  adminNotes: text("admin_notes"),
  sellerNotes: text("seller_notes"),
  processedBy: integer("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Group Buy Tables for VyronaSocial
export const groupBuyProducts = pgTable("group_buy_products", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  isApproved: boolean("is_approved").notNull().default(false),
  minQuantity: integer("min_quantity").notNull().default(10), // minimum 10 pieces for single product
  groupBuyPrice: integer("group_buy_price").notNull(), // discounted price in cents
  originalPrice: integer("original_price").notNull(), // original price in cents
  discountPercentage: integer("discount_percentage").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupBuyCampaigns = pgTable("group_buy_campaigns", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  shoppingGroupId: integer("shopping_group_id").references(() => shoppingGroups.id),
  minParticipants: integer("min_participants").notNull().default(5),
  maxParticipants: integer("max_participants").notNull().default(100),
  targetQuantity: integer("target_quantity").notNull(), // total quantity needed across all products
  currentQuantity: integer("current_quantity").notNull().default(0),
  status: varchar("status", { length: 50 }).default("active").notNull(), // active, completed, cancelled
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupBuyCampaignProducts = pgTable("group_buy_campaign_products", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => groupBuyCampaigns.id),
  groupBuyProductId: integer("group_buy_product_id").notNull().references(() => groupBuyProducts.id),
  targetQuantity: integer("target_quantity").notNull(),
  currentQuantity: integer("current_quantity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupBuyParticipants = pgTable("group_buy_participants", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => groupBuyCampaigns.id),
  userId: integer("user_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull(),
  totalAmount: integer("total_amount").notNull(), // in cents
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, confirmed, paid, cancelled
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const groupBuyOrders = pgTable("group_buy_orders", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => groupBuyCampaigns.id),
  userId: integer("user_id").notNull().references(() => users.id),
  totalAmount: integer("total_amount").notNull(), // in cents
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  shippingAddress: jsonb("shipping_address"),
  contactInfo: jsonb("contact_info"),
  orderNotes: text("order_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
});

export const insertShoppingRoomSchema = createInsertSchema(shoppingRooms).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true,
});

// Group Cart Insert Schemas
export const insertGroupCartSchema = createInsertSchema(groupCarts).omit({
  id: true,
  createdAt: true,
});

export const insertGroupCartContributionSchema = createInsertSchema(groupCartContributions).omit({
  id: true,
  joinedAt: true,
});

// VyronaWallet Insert Schemas
export const insertVyronaWalletSchema = createInsertSchema(vyronaWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Group Order Insert Schemas
export const insertGroupOrderSchema = createInsertSchema(groupOrders).omit({
  id: true,
  createdAt: true,
});

export const insertGroupOrderContributionSchema = createInsertSchema(groupOrderContributions).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

export const insertGameScoreSchema = createInsertSchema(gameScores).omit({
  id: true,
  playedAt: true,
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

// VyronaSocial Insert Schemas
export const insertShoppingGroupSchema = createInsertSchema(shoppingGroups).omit({
  id: true,
  createdAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertGroupWishlistSchema = createInsertSchema(groupWishlists).omit({
  id: true,
  addedAt: true,
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({
  id: true,
  sentAt: true,
});

export const insertProductShareSchema = createInsertSchema(productShares).omit({
  id: true,
  sharedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// VyronaInstaShop Insert Schemas
export const insertInstagramStoreSchema = createInsertSchema(instagramStores).omit({
  id: true,
  connectedAt: true,
});

export const insertInstagramProductSchema = createInsertSchema(instagramProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstagramOrderSchema = createInsertSchema(instagramOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstagramAnalyticsSchema = createInsertSchema(instagramAnalytics).omit({
  id: true,
});

// VyronaRead Insert Schemas
export const insertLibraryIntegrationRequestSchema = createInsertSchema(libraryIntegrationRequests, {
  sellerId: z.number(),
  libraryName: z.string().min(1),
  libraryType: z.string().min(1),
  address: z.string().min(1),
  contactPerson: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  processedBy: true,
  status: true,
  adminNotes: true,
});

export const insertPhysicalBookSchema = createInsertSchema(physicalBooks, {
  libraryId: z.number(),
  title: z.string().min(1),
  author: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEBookSchema = createInsertSchema(eBooks, {
  sellerId: z.number(),
  title: z.string().min(1),
  author: z.string().min(1),
  format: z.string().min(1),
  fileUrl: z.string().url(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  downloads: true,
});

export const insertBookLoanSchema = createInsertSchema(bookLoans, {
  bookId: z.number(),
  userId: z.number(),
  dueDate: z.date(),
}).omit({
  id: true,
  loanDate: true,
});



// Group Buy Insert Schemas
export const insertGroupBuyProductSchema = createInsertSchema(groupBuyProducts, {
  productId: z.number(),
  sellerId: z.number(),
  minQuantity: z.number().min(4, "Minimum quantity must be at least 4"),
  groupBuyPrice: z.number().min(1, "Group buy price must be positive"),
  originalPrice: z.number().min(1, "Original price must be positive"),
  discountPercentage: z.number().min(1).max(70, "Discount must be between 1-70%"),
}).omit({
  id: true,
  createdAt: true,
  isApproved: true,
  approvedAt: true,
  approvedBy: true,
});

export const insertGroupBuyCampaignSchema = createInsertSchema(groupBuyCampaigns, {
  title: z.string().min(1, "Title is required"),
  createdBy: z.number(),
  minParticipants: z.number().min(4, "Minimum 4 participants required"),
  maxParticipants: z.number().max(100, "Maximum 100 participants allowed"),
  targetQuantity: z.number().min(4, "Minimum target quantity is 4"),
  endDate: z.date(),
}).omit({
  id: true,
  createdAt: true,
  currentQuantity: true,
  completedAt: true,
});

export const insertGroupBuyCampaignProductSchema = createInsertSchema(groupBuyCampaignProducts).omit({
  id: true,
  createdAt: true,
});

export const insertGroupBuyParticipantSchema = createInsertSchema(groupBuyParticipants).omit({
  id: true,
  joinedAt: true,
  confirmedAt: true,
});

export const insertGroupBuyOrderSchema = createInsertSchema(groupBuyOrders).omit({
  id: true,
  createdAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type ShoppingRoom = typeof shoppingRooms.$inferSelect;
export type InsertShoppingRoom = z.infer<typeof insertShoppingRoomSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Group Cart Types
export type GroupCart = typeof groupCarts.$inferSelect;
export type InsertGroupCart = z.infer<typeof insertGroupCartSchema>;
export type GroupCartContribution = typeof groupCartContributions.$inferSelect;
export type InsertGroupCartContribution = z.infer<typeof insertGroupCartContributionSchema>;

// VyronaWallet Types
export type VyronaWallet = typeof vyronaWallets.$inferSelect;
export type InsertVyronaWallet = z.infer<typeof insertVyronaWalletSchema>;

// Group Order Types
export type GroupOrder = typeof groupOrders.$inferSelect;
export type InsertGroupOrder = z.infer<typeof insertGroupOrderSchema>;
export type GroupOrderContribution = typeof groupOrderContributions.$inferSelect;
export type InsertGroupOrderContribution = z.infer<typeof insertGroupOrderContributionSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;

// VyronaSocial Types
export type ShoppingGroup = typeof shoppingGroups.$inferSelect & {
  memberCount?: number;
  category?: string;
  privacy?: string;
  currentGame?: string | null;
  scheduledTime?: Date | null;
};
export type InsertShoppingGroup = z.infer<typeof insertShoppingGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupWishlist = typeof groupWishlists.$inferSelect;
export type InsertGroupWishlist = z.infer<typeof insertGroupWishlistSchema>;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type ProductShare = typeof productShares.$inferSelect;
export type InsertProductShare = z.infer<typeof insertProductShareSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// VyronaInstaShop Types
export type InstagramStore = typeof instagramStores.$inferSelect;
export type InsertInstagramStore = z.infer<typeof insertInstagramStoreSchema>;
export type InstagramProduct = typeof instagramProducts.$inferSelect;
export type InsertInstagramProduct = z.infer<typeof insertInstagramProductSchema>;
export type InstagramOrder = typeof instagramOrders.$inferSelect;
export type InsertInstagramOrder = z.infer<typeof insertInstagramOrderSchema>;
export type InstagramAnalytics = typeof instagramAnalytics.$inferSelect;
export type InsertInstagramAnalytics = z.infer<typeof insertInstagramAnalyticsSchema>;

// VyronaRead Types
export type LibraryIntegrationRequest = typeof libraryIntegrationRequests.$inferSelect;
export type InsertLibraryIntegrationRequest = z.infer<typeof insertLibraryIntegrationRequestSchema>;
export type PhysicalBook = typeof physicalBooks.$inferSelect;
export type InsertPhysicalBook = z.infer<typeof insertPhysicalBookSchema>;
export type BookLoan = typeof bookLoans.$inferSelect;
export type InsertBookLoan = z.infer<typeof insertBookLoanSchema>;
export type EBook = typeof eBooks.$inferSelect;
export type InsertEBook = z.infer<typeof insertEBookSchema>;

// Group Buy Types
export type GroupBuyProduct = typeof groupBuyProducts.$inferSelect;
export type InsertGroupBuyProduct = z.infer<typeof insertGroupBuyProductSchema>;
export type GroupBuyCampaign = typeof groupBuyCampaigns.$inferSelect;
export type InsertGroupBuyCampaign = z.infer<typeof insertGroupBuyCampaignSchema>;
export type GroupBuyParticipant = typeof groupBuyParticipants.$inferSelect;
export type InsertGroupBuyParticipant = z.infer<typeof insertGroupBuyParticipantSchema>;
export type GroupBuyOrder = typeof groupBuyOrders.$inferSelect;
export type GroupBuyCampaignProduct = typeof groupBuyCampaignProducts.$inferSelect;
export type InsertGroupBuyCampaignProduct = z.infer<typeof insertGroupBuyCampaignProductSchema>;
export type InsertGroupBuyOrder = z.infer<typeof insertGroupBuyOrderSchema>;