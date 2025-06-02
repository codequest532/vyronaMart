import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  mobile: text("mobile"),
  password: text("password").notNull(),
  vyronaCoins: integer("vyrona_coins").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
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
  creatorId: integer("creator_id").notNull(),
  currentGame: text("current_game"), // 'ludo', 'trivia', '2048', 'spinwheel'
  totalCart: integer("total_cart").default(0), // in cents
  memberCount: integer("member_count").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  roomId: integer("room_id"), // null for individual cart, set for room cart
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
  message: text("message").notNull(),
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
  currency: text("currency").default("USD"),
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
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;

// VyronaSocial Types
export type ShoppingGroup = typeof shoppingGroups.$inferSelect;
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
