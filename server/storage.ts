import { 
  users, products, stores, shoppingRooms, cartItems, orders, achievements, gameScores, otpVerifications,
  shoppingGroups, groupMembers, groupWishlists, groupMessages, productShares, notifications,
  instagramStores, instagramProducts, instagramOrders, instagramAnalytics,
  type User, type InsertUser, type Product, type InsertProduct, 
  type Store, type InsertStore, type ShoppingRoom, type InsertShoppingRoom,
  type CartItem, type InsertCartItem, type Order, type InsertOrder,
  type Achievement, type InsertAchievement, type GameScore, type InsertGameScore,
  type OtpVerification, type InsertOtpVerification,
  type ShoppingGroup, type InsertShoppingGroup, type GroupMember, type InsertGroupMember,
  type GroupWishlist, type InsertGroupWishlist, type GroupMessage, type InsertGroupMessage,
  type ProductShare, type InsertProductShare, type Notification, type InsertNotification,
  type InstagramStore, type InsertInstagramStore, type InstagramProduct, type InsertInstagramProduct,
  type InstagramOrder, type InsertInstagramOrder, type InstagramAnalytics, type InsertInstagramAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoins(id: number, coins: number): Promise<User | undefined>;
  updateUserXP(id: number, xp: number): Promise<User | undefined>;
  updateUserPassword(email: string, newPassword: string): Promise<void>;

  // OTP Verification
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerification(identifier: string, otp: string, type: string): Promise<OtpVerification | undefined>;
  markOtpAsVerified(id: number): Promise<void>;

  // Products
  getProducts(module?: string, category?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Stores
  getStores(type?: string): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;

  // Shopping Rooms
  getShoppingRooms(): Promise<ShoppingRoom[]>;
  getShoppingRoom(id: number): Promise<ShoppingRoom | undefined>;
  createShoppingRoom(room: InsertShoppingRoom): Promise<ShoppingRoom>;

  // Cart
  getCartItems(userId: number, roomId?: number): Promise<CartItem[]>;
  addCartItem(item: InsertCartItem): Promise<CartItem>;
  removeCartItem(id: number): Promise<boolean>;

  // Orders
  getOrders(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;

  // Achievements
  getUserAchievements(userId: number): Promise<Achievement[]>;
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Game Scores
  addGameScore(score: InsertGameScore): Promise<GameScore>;
  getUserGameScores(userId: number): Promise<GameScore[]>;

  // VyronaSocial - Shopping Groups
  createShoppingGroup(group: InsertShoppingGroup): Promise<ShoppingGroup>;
  getShoppingGroups(userId: number): Promise<ShoppingGroup[]>;
  getShoppingGroup(id: number): Promise<ShoppingGroup | undefined>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  removeGroupMember(groupId: number, userId: number): Promise<boolean>;

  // VyronaSocial - Group Wishlists
  addToGroupWishlist(wishlist: InsertGroupWishlist): Promise<GroupWishlist>;
  getGroupWishlist(groupId: number): Promise<GroupWishlist[]>;
  removeFromGroupWishlist(id: number): Promise<boolean>;

  // VyronaSocial - Group Messages
  addGroupMessage(message: InsertGroupMessage): Promise<GroupMessage>;
  getGroupMessages(groupId: number): Promise<GroupMessage[]>;

  // VyronaSocial - Product Shares
  shareProduct(share: InsertProductShare): Promise<ProductShare>;
  getProductShares(userId: number): Promise<ProductShare[]>;

  // VyronaSocial - Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;

  // VyronaInstaShop - Instagram Store Management
  connectInstagramStore(store: InsertInstagramStore): Promise<InstagramStore>;
  getUserInstagramStores(userId: number): Promise<InstagramStore[]>;
  getInstagramStore(id: number): Promise<InstagramStore | undefined>;
  updateInstagramStoreTokens(id: number, accessToken: string, refreshToken: string, expiresAt: Date): Promise<void>;
  disconnectInstagramStore(id: number): Promise<boolean>;

  // VyronaInstaShop - Instagram Products
  syncInstagramProducts(storeId: number, products: InsertInstagramProduct[]): Promise<InstagramProduct[]>;
  getInstagramProducts(storeId: number): Promise<InstagramProduct[]>;
  updateInstagramProduct(id: number, updates: Partial<InsertInstagramProduct>): Promise<InstagramProduct | undefined>;

  // VyronaInstaShop - Instagram Orders
  createInstagramOrder(order: InsertInstagramOrder): Promise<InstagramOrder>;
  getInstagramOrders(storeId: number): Promise<InstagramOrder[]>;
  updateInstagramOrderStatus(id: number, status: string): Promise<InstagramOrder | undefined>;

  // VyronaInstaShop - Analytics
  recordInstagramAnalytics(analytics: InsertInstagramAnalytics): Promise<InstagramAnalytics>;
  getInstagramAnalytics(storeId: number, startDate: Date, endDate: Date): Promise<InstagramAnalytics[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private products: Map<number, Product> = new Map();
  private stores: Map<number, Store> = new Map();
  private shoppingRooms: Map<number, ShoppingRoom> = new Map();
  private cartItems: Map<number, CartItem> = new Map();
  private orders: Map<number, Order> = new Map();
  private achievements: Map<number, Achievement> = new Map();
  private gameScores: Map<number, GameScore> = new Map();
  
  private currentUserId = 1;
  private currentProductId = 1;
  private currentStoreId = 1;
  private currentRoomId = 1;
  private currentCartId = 1;
  private currentOrderId = 1;
  private currentAchievementId = 1;
  private currentGameScoreId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default admin account
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      email: "mgmags@gmail.com",
      mobile: null,
      password: "admin123",
      role: "admin",
      vyronaCoins: 1000,
      xp: 0,
      level: 1,
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserCoins(id: number, coins: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.vyronaCoins += coins;
      this.users.set(id, user);
      return user;
    }
    return undefined;
  }

  async updateUserXP(id: number, xp: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.xp += xp;
      // Level up logic
      const newLevel = Math.floor(user.xp / 1000) + 1;
      if (newLevel > user.level) {
        user.level = newLevel;
      }
      this.users.set(id, user);
      return user;
    }
    return undefined;
  }

  // Product methods
  async getProducts(module?: string, category?: string): Promise<Product[]> {
    let products = Array.from(this.products.values());
    if (module) {
      products = products.filter(p => p.module === module);
    }
    if (category) {
      products = products.filter(p => p.category === category);
    }
    return products;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      ...insertProduct,
      id: this.currentProductId++,
    };
    this.products.set(product.id, product);
    return product;
  }

  // Store methods
  async getStores(type?: string): Promise<Store[]> {
    let stores = Array.from(this.stores.values());
    if (type) {
      stores = stores.filter(s => s.type === type);
    }
    return stores;
  }

  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const store: Store = {
      ...insertStore,
      id: this.currentStoreId++,
    };
    this.stores.set(store.id, store);
    return store;
  }

  // Shopping Room methods
  async getShoppingRooms(): Promise<ShoppingRoom[]> {
    return Array.from(this.shoppingRooms.values()).filter(room => room.isActive);
  }

  async getShoppingRoom(id: number): Promise<ShoppingRoom | undefined> {
    return this.shoppingRooms.get(id);
  }

  async createShoppingRoom(insertRoom: InsertShoppingRoom): Promise<ShoppingRoom> {
    const room: ShoppingRoom = {
      ...insertRoom,
      id: this.currentRoomId++,
      createdAt: new Date(),
    };
    this.shoppingRooms.set(room.id, room);
    return room;
  }

  // Cart methods
  async getCartItems(userId: number, roomId?: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => 
      item.userId === userId && item.roomId === roomId
    );
  }

  async addCartItem(insertItem: InsertCartItem): Promise<CartItem> {
    const item: CartItem = {
      ...insertItem,
      id: this.currentCartId++,
    };
    this.cartItems.set(item.id, item);
    return item;
  }

  async removeCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  // Order methods
  async getOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const order: Order = {
      ...insertOrder,
      id: this.currentOrderId++,
      createdAt: new Date(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  // Achievement methods
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(achievement => achievement.userId === userId);
  }

  async addAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const achievement: Achievement = {
      ...insertAchievement,
      id: this.currentAchievementId++,
      earnedAt: new Date(),
    };
    this.achievements.set(achievement.id, achievement);
    return achievement;
  }

  // Game Score methods
  async addGameScore(insertScore: InsertGameScore): Promise<GameScore> {
    const score: GameScore = {
      ...insertScore,
      id: this.currentGameScoreId++,
      playedAt: new Date(),
    };
    this.gameScores.set(score.id, score);
    return score;
  }

  async getUserGameScores(userId: number): Promise<GameScore[]> {
    return Array.from(this.gameScores.values()).filter(score => score.userId === userId);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserCoins(id: number, coins: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ vyronaCoins: coins })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserXP(id: number, xp: number): Promise<User | undefined> {
    const newLevel = Math.floor(xp / 1000) + 1;
    const [user] = await db
      .update(users)
      .set({ xp, level: newLevel })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.email, email));
  }

  async createOtpVerification(otpData: InsertOtpVerification): Promise<OtpVerification> {
    const [otp] = await db
      .insert(otpVerifications)
      .values(otpData)
      .returning();
    return otp;
  }

  async getOtpVerification(identifier: string, otp: string, type: string): Promise<OtpVerification | undefined> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(and(
        eq(otpVerifications.identifier, identifier),
        eq(otpVerifications.otp, otp),
        eq(otpVerifications.type, type)
      ));
    return verification;
  }

  async markOtpAsVerified(id: number): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ verified: true })
      .where(eq(otpVerifications.id, id));
  }

  async getProducts(module?: string, category?: string): Promise<Product[]> {
    if (module && category) {
      return await db.select().from(products).where(and(eq(products.module, module), eq(products.category, category)));
    } else if (module) {
      return await db.select().from(products).where(eq(products.module, module));
    } else if (category) {
      return await db.select().from(products).where(eq(products.category, category));
    }
    
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async getStores(type?: string): Promise<Store[]> {
    if (type) {
      return await db.select().from(stores).where(eq(stores.type, type));
    }
    return await db.select().from(stores);
  }

  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db
      .insert(stores)
      .values(insertStore)
      .returning();
    return store;
  }

  async getShoppingRooms(): Promise<ShoppingRoom[]> {
    return await db.select().from(shoppingRooms).where(eq(shoppingRooms.isActive, true));
  }

  async getShoppingRoom(id: number): Promise<ShoppingRoom | undefined> {
    const [room] = await db.select().from(shoppingRooms).where(eq(shoppingRooms.id, id));
    return room || undefined;
  }

  async createShoppingRoom(insertRoom: InsertShoppingRoom): Promise<ShoppingRoom> {
    const [room] = await db
      .insert(shoppingRooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async getCartItems(userId: number, roomId?: number): Promise<CartItem[]> {
    if (roomId !== undefined) {
      return await db.select().from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.roomId, roomId)));
    }
    return await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, userId), isNull(cartItems.roomId)));
  }

  async addCartItem(insertItem: InsertCartItem): Promise<CartItem> {
    const [item] = await db
      .insert(cartItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async removeCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async addAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(insertAchievement)
      .returning();
    return achievement;
  }

  async addGameScore(insertScore: InsertGameScore): Promise<GameScore> {
    const [score] = await db
      .insert(gameScores)
      .values(insertScore)
      .returning();
    return score;
  }

  async getUserGameScores(userId: number): Promise<GameScore[]> {
    return await db.select().from(gameScores).where(eq(gameScores.userId, userId));
  }

  // VyronaSocial - Shopping Groups
  async createShoppingGroup(insertGroup: InsertShoppingGroup): Promise<ShoppingGroup> {
    const [group] = await db
      .insert(shoppingGroups)
      .values(insertGroup)
      .returning();
    
    // Add creator as group member
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: insertGroup.creatorId,
      role: "creator"
    });
    
    return group;
  }

  async getShoppingGroups(userId: number): Promise<ShoppingGroup[]> {
    const result = await db
      .select({
        id: shoppingGroups.id,
        name: shoppingGroups.name,
        description: shoppingGroups.description,
        creatorId: shoppingGroups.creatorId,
        isActive: shoppingGroups.isActive,
        maxMembers: shoppingGroups.maxMembers,
        createdAt: shoppingGroups.createdAt,
      })
      .from(shoppingGroups)
      .innerJoin(groupMembers, eq(groupMembers.groupId, shoppingGroups.id))
      .where(eq(groupMembers.userId, userId));
    return result;
  }

  async getShoppingGroup(id: number): Promise<ShoppingGroup | undefined> {
    const [group] = await db.select().from(shoppingGroups).where(eq(shoppingGroups.id, id));
    return group;
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db
      .insert(groupMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  }

  async removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // VyronaSocial - Group Wishlists
  async addToGroupWishlist(insertWishlist: InsertGroupWishlist): Promise<GroupWishlist> {
    const [wishlist] = await db
      .insert(groupWishlists)
      .values(insertWishlist)
      .returning();
    
    // Create notification for other group members
    const members = await this.getGroupMembers(insertWishlist.groupId);
    for (const member of members) {
      if (member.userId !== insertWishlist.addedBy) {
        await this.createNotification({
          userId: member.userId,
          type: "wishlist_add",
          title: "New Item Added to Group Wishlist",
          message: "A new product was added to your group wishlist",
          metadata: { groupId: insertWishlist.groupId, productId: insertWishlist.productId }
        });
      }
    }
    
    return wishlist;
  }

  async getGroupWishlist(groupId: number): Promise<GroupWishlist[]> {
    return await db.select().from(groupWishlists).where(eq(groupWishlists.groupId, groupId));
  }

  async removeFromGroupWishlist(id: number): Promise<boolean> {
    const result = await db.delete(groupWishlists).where(eq(groupWishlists.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // VyronaSocial - Group Messages
  async addGroupMessage(insertMessage: InsertGroupMessage): Promise<GroupMessage> {
    const [message] = await db
      .insert(groupMessages)
      .values(insertMessage)
      .returning();
    
    // Create notifications for other group members
    const members = await this.getGroupMembers(insertMessage.groupId);
    for (const member of members) {
      if (member.userId !== insertMessage.userId) {
        await this.createNotification({
          userId: member.userId,
          type: "message",
          title: "New Group Message",
          message: "You have a new message in your shopping group",
          metadata: { groupId: insertMessage.groupId, messageId: message.id }
        });
      }
    }
    
    return message;
  }

  async getGroupMessages(groupId: number): Promise<GroupMessage[]> {
    return await db
      .select()
      .from(groupMessages)
      .where(eq(groupMessages.groupId, groupId))
      .orderBy(groupMessages.sentAt);
  }

  // VyronaSocial - Product Shares
  async shareProduct(insertShare: InsertProductShare): Promise<ProductShare> {
    const [share] = await db
      .insert(productShares)
      .values(insertShare)
      .returning();
    
    // If sharing to a group, create notifications and add message
    if (insertShare.groupId && insertShare.shareType === "group") {
      const members = await this.getGroupMembers(insertShare.groupId);
      for (const member of members) {
        if (member.userId !== insertShare.sharedBy) {
          await this.createNotification({
            userId: member.userId,
            type: "product_share",
            title: "Product Shared in Group",
            message: "A new product was shared in your shopping group",
            metadata: { groupId: insertShare.groupId, productId: insertShare.productId }
          });
        }
      }
      
      // Add system message to group
      await db.insert(groupMessages).values({
        groupId: insertShare.groupId,
        userId: insertShare.sharedBy,
        message: insertShare.message || "Shared a product",
        messageType: "product_share",
        metadata: { productId: insertShare.productId, shareId: share.id }
      });
    }
    
    return share;
  }

  async getProductShares(userId: number): Promise<ProductShare[]> {
    return await db.select().from(productShares).where(eq(productShares.sharedBy, userId));
  }

  // VyronaSocial - Notifications
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Seed initial data when needed
  async seedInitialData(): Promise<void> {
    // No initial seed data - clean development environment
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
