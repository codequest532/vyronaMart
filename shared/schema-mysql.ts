import { mysqlTable, int, varchar, text, timestamp, json, boolean, decimal } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = mysqlTable("users", {
  id: int().primaryKey().autoincrement(),
  username: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).default('customer').notNull(),
  sellerType: varchar("seller_type", { length: 100 }),
  coins: int().default(0).notNull(),
  xp: int().default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = mysqlTable("products", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 500 }).notNull(),
  description: text(),
  price: int().notNull(), // Store in cents
  category: varchar({ length: 100 }).notNull(),
  module: varchar({ length: 50 }).notNull(),
  imageUrl: text("image_url"),
  metadata: json(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = mysqlTable("orders", {
  id: int().primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  totalAmount: int("total_amount").notNull(),
  status: varchar({ length: 50 }).default('pending').notNull(),
  module: varchar({ length: 50 }).notNull(),
  metadata: json(),
  lastEmailSent: varchar("last_email_sent", { length: 50 }),
  emailHistory: json("email_history"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cart items table
export const cartItems = mysqlTable("cart_items", {
  id: int().primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  productId: int("product_id").notNull(),
  quantity: int().default(1).notNull(),
  roomId: int("room_id"),
});

// Stores table
export const stores = mysqlTable("stores", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  sellerId: int("seller_id").notNull(),
  category: varchar({ length: 100 }),
  module: varchar({ length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  metadata: json(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping groups table
export const shoppingGroups = mysqlTable("shopping_groups", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  creatorId: int("creator_id").notNull(),
  roomCode: varchar("room_code", { length: 10 }).unique(),
  module: varchar({ length: 50 }).default('social').notNull(),
  isActive: boolean("is_active").default(true),
  memberCount: int("member_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group members table
export const groupMembers = mysqlTable("group_members", {
  id: int().primaryKey().autoincrement(),
  groupId: int("group_id").notNull(),
  userId: int("user_id").notNull(),
  role: varchar({ length: 50 }).default('member').notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Wallet transactions table
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int().primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  amount: int().notNull(),
  type: varchar({ length: 50 }).notNull(),
  description: text(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = mysqlTable("notifications", {
  id: int().primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar({ length: 255 }).notNull(),
  message: text(),
  type: varchar({ length: 50 }).default('info'),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Instagram products table
export const instagramProducts = mysqlTable("instagram_products", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 500 }).notNull(),
  description: text(),
  price: int().notNull(),
  storeId: int("store_id").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Instagram stores table
export const instagramStores = mysqlTable("instagram_stores", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  sellerId: int("seller_id").notNull(),
  instagramHandle: varchar("instagram_handle", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Physical books table
export const physicalBooks = mysqlTable("physical_books", {
  id: int().primaryKey().autoincrement(),
  title: varchar({ length: 500 }).notNull(),
  author: varchar({ length: 255 }).notNull(),
  isbn: varchar({ length: 20 }),
  genre: varchar({ length: 100 }),
  publisher: varchar({ length: 255 }),
  publicationYear: varchar("publication_year", { length: 4 }),
  language: varchar({ length: 50 }).default('English'),
  sellerId: int("seller_id"),
  purchasePrice: int("purchase_price").notNull(),
  rentalPrice: int("rental_price").notNull(),
  availableQuantity: int("available_quantity").default(1),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// E-books table
export const eBooks = mysqlTable("e_books", {
  id: int().primaryKey().autoincrement(),
  title: varchar({ length: 500 }).notNull(),
  author: varchar({ length: 255 }).notNull(),
  isbn: varchar({ length: 20 }),
  genre: varchar({ length: 100 }),
  publisher: varchar({ length: 255 }),
  publicationYear: varchar("publication_year", { length: 4 }),
  language: varchar({ length: 50 }).default('English'),
  format: varchar({ length: 20 }).default('PDF'),
  fileSize: varchar("file_size", { length: 20 }),
  sellerId: int("seller_id"),
  salePrice: int("sale_price").notNull(),
  rentalPrice: int("rental_price").notNull(),
  fileUrl: text("file_url"),
  coverImageUrl: text("cover_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP verifications table
export const otpVerifications = mysqlTable("otp_verifications", {
  id: int().primaryKey().autoincrement(),
  identifier: varchar({ length: 255 }).notNull(),
  otp: varchar({ length: 10 }).notNull(),
  type: varchar({ length: 50 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertStoreSchema = createInsertSchema(stores);
export const insertShoppingGroupSchema = createInsertSchema(shoppingGroups);
export const insertGroupMemberSchema = createInsertSchema(groupMembers);
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions);
export const insertNotificationSchema = createInsertSchema(notifications);

// Export types
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type ShoppingGroup = typeof shoppingGroups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;