import { 
  users, products, stores, shoppingRooms, cartItems, orders, achievements, gameScores, otpVerifications,
  shoppingGroups, groupMembers, groupWishlists, groupMessages, productShares, notifications,
  instagramStores, instagramProducts, instagramOrders, instagramAnalytics,
  groupBuyProducts, groupBuyCampaigns, groupBuyParticipants,
  type User, type InsertUser, type Product, type InsertProduct, 
  type Store, type InsertStore, type ShoppingRoom, type InsertShoppingRoom,
  type CartItem, type InsertCartItem, type Order, type InsertOrder,
  type Achievement, type InsertAchievement, type GameScore, type InsertGameScore,
  type OtpVerification, type InsertOtpVerification,
  type ShoppingGroup, type InsertShoppingGroup, type GroupMember, type InsertGroupMember,
  type GroupWishlist, type InsertGroupWishlist, type GroupMessage, type InsertGroupMessage,
  type ProductShare, type InsertProductShare, type Notification, type InsertNotification,
  type InstagramStore, type InsertInstagramStore, type InstagramProduct, type InsertInstagramProduct,
  type InstagramOrder, type InsertInstagramOrder, type InstagramAnalytics, type InsertInstagramAnalytics,
  type GroupBuyProduct, type InsertGroupBuyProduct, type GroupBuyCampaign, type InsertGroupBuyCampaign,
  type GroupBuyParticipant, type InsertGroupBuyParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull } from "drizzle-orm";
import {
  libraryIntegrationRequests,
  physicalBooks,
  eBooks,
  bookLoans,
} from "@shared/schema";

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

  // VyronaRead Books - Library Integration Requests
  createLibraryIntegrationRequest(request: InsertLibraryIntegrationRequest): Promise<LibraryIntegrationRequest>;
  getLibraryIntegrationRequests(): Promise<LibraryIntegrationRequest[]>;
  updateLibraryIntegrationRequestStatus(id: number, status: string, processedBy: number, adminNotes?: string): Promise<LibraryIntegrationRequest | undefined>;

  // VyronaRead Books - Physical Books
  createPhysicalBook(book: InsertPhysicalBook): Promise<PhysicalBook>;
  getPhysicalBooks(libraryId?: number): Promise<PhysicalBook[]>;
  updatePhysicalBook(id: number, updates: Partial<InsertPhysicalBook>): Promise<PhysicalBook | undefined>;
  deletePhysicalBook(id: number): Promise<boolean>;

  // VyronaRead Books - E-Books
  createEBook(ebook: InsertEBook): Promise<EBook>;
  getEBooks(sellerId: number): Promise<EBook[]>;
  updateEBook(id: number, updates: Partial<InsertEBook>): Promise<EBook | undefined>;
  deleteEBook(id: number): Promise<boolean>;

  // VyronaRead Books - Book Loans
  createBookLoan(loan: InsertBookLoan): Promise<BookLoan>;
  getBookLoans(libraryId?: number, borrowerId?: number): Promise<BookLoan[]>;
  returnBook(loanId: number): Promise<BookLoan | undefined>;

  // Book Management - Additional methods
  createLibraryBooks(requestId: number, libraryData: any): Promise<void>;
  getBookById(id: number): Promise<any>;
  createBookOrder(order: any): Promise<any>;

  // VyronaSocial - Group Buy Products
  createGroupBuyProduct(product: InsertGroupBuyProduct): Promise<GroupBuyProduct>;
  getGroupBuyProducts(sellerId?: number): Promise<GroupBuyProduct[]>;
  approveGroupBuyProduct(id: number, approvedBy: number): Promise<GroupBuyProduct | undefined>;
  getApprovedGroupBuyProducts(): Promise<GroupBuyProduct[]>;

  // VyronaSocial - Group Buy Campaigns
  createGroupBuyCampaign(campaign: InsertGroupBuyCampaign): Promise<GroupBuyCampaign>;
  getGroupBuyCampaigns(userId?: number): Promise<GroupBuyCampaign[]>;
  getGroupBuyCampaign(id: number): Promise<GroupBuyCampaign | undefined>;
  updateCampaignQuantity(id: number, quantity: number): Promise<void>;

  // VyronaSocial - Group Buy Participation
  joinGroupBuyCampaign(participant: InsertGroupBuyParticipant): Promise<GroupBuyParticipant>;
  getGroupBuyParticipants(campaignId: number): Promise<GroupBuyParticipant[]>;
  updateParticipantStatus(id: number, status: string): Promise<void>;
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
  private libraryIntegrationRequests: Map<number, any> = new Map();
  private physicalBooks: Map<number, any> = new Map();
  private eBooks: Map<number, any> = new Map();
  private bookLoans: Map<number, any> = new Map();
  private currentLibraryRequestId = 1;
  private currentPhysicalBookId = 1;
  private currentEBookId = 1;
  private currentBookLoanId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Check if mgmags25@gmail.com already exists, if not create admin account
    const existingAdmin = Array.from(this.users.values()).find(user => user.email === "mgmags25@gmail.com");
    
    if (!existingAdmin) {
      // Create default admin account only if it doesn't exist
      const adminUser: User = {
        id: this.currentUserId++,
        username: "admin",
        email: "mgmags25@gmail.com",
        mobile: null,
        password: "12345678",
        role: "admin",
        vyronaCoins: 1000,
        xp: 0,
        level: 1,
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
      };
      this.users.set(adminUser.id, adminUser);
    } else {
      // If the account exists, ensure it has admin role
      existingAdmin.role = "admin";
    }

    // Add sample books for VyronaRead
    if (this.products.size === 0) {
      // Physical Books
      const physicalBook1: Product = {
        id: this.currentProductId++,
        name: "The Art of Programming",
        description: "A comprehensive guide to software development",
        category: "programming",
        price: 2999, // ₹29.99
        module: "read",
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
        storeId: null,
        metadata: {
          author: "Robert Martin",
          type: "physical",
          pages: 350,
          isbn: "978-0134685991",
          rentalPrice: 599 // ₹5.99 per week
        }
      };

      const physicalBook2: Product = {
        id: this.currentProductId++,
        name: "Digital Marketing Mastery",
        description: "Complete guide to modern digital marketing",
        category: "business",
        price: 1999,
        module: "read",
        imageUrl: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=400",
        storeId: null,
        metadata: {
          author: "Sarah Johnson",
          type: "physical",
          pages: 280,
          isbn: "978-1234567890",
          rentalPrice: 399
        }
      };

      // Digital Books
      const digitalBook1: Product = {
        id: this.currentProductId++,
        name: "Modern Web Development",
        description: "Learn React, Node.js, and modern web technologies",
        category: "technology",
        price: 1499,
        module: "read",
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
        storeId: null,
        metadata: {
          author: "Alex Thompson",
          type: "digital",
          pages: 425,
          format: "PDF, EPUB",
          fileSize: "15MB"
        }
      };

      const digitalBook2: Product = {
        id: this.currentProductId++,
        name: "Data Science Fundamentals",
        description: "Introduction to data analysis and machine learning",
        category: "technology",
        price: 2499,
        module: "read",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
        storeId: null,
        metadata: {
          author: "Dr. Emily Chen",
          type: "digital",
          pages: 520,
          format: "PDF, EPUB",
          fileSize: "22MB"
        }
      };

      this.products.set(physicalBook1.id, physicalBook1);
      this.products.set(physicalBook2.id, physicalBook2);
      this.products.set(digitalBook1.id, digitalBook1);
      this.products.set(digitalBook2.id, digitalBook2);
    }
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
    // Create room with required schema fields
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [group] = await db
      .insert(shoppingGroups)
      .values({
        name: insertGroup.name,
        description: insertGroup.description,
        category: insertGroup.category || "general",
        privacy: insertGroup.privacy || "public",
        roomCode: roomCode,
        creatorId: insertGroup.creatorId,
        isActive: true,
        memberCount: 1,
        totalCart: 0,
        maxMembers: insertGroup.maxMembers || 10,
        createdAt: new Date()
      })
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
    // Return empty array for now until schema is properly updated
    return [];
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

  // VyronaRead Books - Library Integration
  async createLibraryIntegrationRequest(request: any): Promise<any> {
    const [newRequest] = await db
      .insert(libraryIntegrationRequests)
      .values({
        ...request,
        status: "pending"
      })
      .returning();
    return newRequest;
  }

  async getLibraryIntegrationRequests(): Promise<any[]> {
    return await db.select().from(libraryIntegrationRequests);
  }

  async updateLibraryIntegrationRequestStatus(id: number, status: string, processedBy: number, adminNotes?: string): Promise<any | null> {
    const [updatedRequest] = await db
      .update(libraryIntegrationRequests)
      .set({
        status,
        processedBy,
        processedAt: new Date(),
        adminNotes: adminNotes || null
      })
      .where(eq(libraryIntegrationRequests.id, id))
      .returning();
    return updatedRequest || null;
  }

  async createPhysicalBook(book: any): Promise<any> {
    const [newBook] = await db
      .insert(physicalBooks)
      .values(book)
      .returning();
    return newBook;
  }

  async getPhysicalBooks(libraryId?: number): Promise<any[]> {
    if (libraryId) {
      return await db.select().from(physicalBooks).where(eq(physicalBooks.libraryId, libraryId));
    }
    return await db.select().from(physicalBooks);
  }

  async updatePhysicalBook(id: number, updates: any): Promise<any | null> {
    const [updatedBook] = await db
      .update(physicalBooks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(physicalBooks.id, id))
      .returning();
    return updatedBook || null;
  }

  async createEBook(ebook: any): Promise<any> {
    const [newEBook] = await db
      .insert(eBooks)
      .values({ ...ebook, downloads: 0 })
      .returning();
    return newEBook;
  }

  async getEBooks(sellerId?: number): Promise<any[]> {
    if (sellerId) {
      return await db.select().from(eBooks).where(eq(eBooks.sellerId, sellerId));
    }
    return await db.select().from(eBooks);
  }

  async updateEBook(id: number, updates: any): Promise<any | null> {
    const [updatedEBook] = await db
      .update(eBooks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(eBooks.id, id))
      .returning();
    return updatedEBook || null;
  }

  async createBookLoan(loan: any): Promise<any> {
    const [newLoan] = await db
      .insert(bookLoans)
      .values({
        ...loan,
        loanDate: new Date(),
        renewalCount: 0
      })
      .returning();
    return newLoan;
  }

  async getBookLoans(libraryId?: number, borrowerId?: number): Promise<any[]> {
    let query = db.select().from(bookLoans);
    
    if (libraryId && borrowerId) {
      return await query.where(and(eq(bookLoans.libraryId, libraryId), eq(bookLoans.borrowerId, borrowerId)));
    } else if (libraryId) {
      return await query.where(eq(bookLoans.libraryId, libraryId));
    } else if (borrowerId) {
      return await query.where(eq(bookLoans.borrowerId, borrowerId));
    }
    
    return await query;
  }

  async returnBook(loanId: number): Promise<any | null> {
    const [returnedLoan] = await db
      .update(bookLoans)
      .set({ returnDate: new Date() })
      .where(eq(bookLoans.id, loanId))
      .returning();
    return returnedLoan || null;
  }

  async createLibraryBooks(requestId: number, libraryData: any): Promise<void> {
    // Create sample books for the approved library
    const sampleBooks = [
      {
        title: `${libraryData.libraryName} - The Art of Programming`,
        isbn: `978-0-${Math.floor(Math.random() * 1000000)}`,
        author: "Tech Author",
        publisher: "Tech Publications",
        publicationYear: 2023,
        genre: "Technology",
        language: "English",
        pages: 350,
        condition: "New",
        price: 29.99,
        isAvailable: true,
        libraryId: requestId
      },
      {
        title: `${libraryData.libraryName} - Modern Web Development`,
        isbn: `978-1-${Math.floor(Math.random() * 1000000)}`,
        author: "Web Developer",
        publisher: "Web Press",
        publicationYear: 2023,
        genre: "Technology",
        language: "English",
        pages: 420,
        condition: "New",
        price: 34.99,
        isAvailable: true,
        libraryId: requestId
      },
      {
        title: `${libraryData.libraryName} - Digital Marketing Guide`,
        isbn: `978-2-${Math.floor(Math.random() * 1000000)}`,
        author: "Marketing Expert",
        publisher: "Business Books",
        publicationYear: 2024,
        genre: "Business",
        language: "English",
        pages: 280,
        condition: "New",
        price: 24.99,
        isAvailable: true,
        libraryId: requestId
      }
    ];

    // Create physical books
    for (const book of sampleBooks.slice(0, 2)) {
      await this.createPhysicalBook(book);
    }

    // Create digital book
    const digitalBook = {
      ...sampleBooks[2],
      sellerId: 2, // Default seller ID
      fileUrl: "https://example.com/book.pdf",
      fileSize: "2.5MB",
      format: "PDF",
      downloads: 0
    };
    await this.createEBook(digitalBook);
  }

  async getBookById(id: number): Promise<any> {
    // Try to find in physical books first
    const physicalBooks = await this.getPhysicalBooks();
    const physicalBook = physicalBooks.find((book: any) => book.id === id);
    if (physicalBook) {
      return { ...physicalBook, type: 'physical' };
    }

    // Try to find in e-books
    const eBooks = await this.getEBooks();
    const eBook = eBooks.find((book: any) => book.id === id);
    if (eBook) {
      return { ...eBook, type: 'digital' };
    }

    return undefined;
  }

  async createBookOrder(order: any): Promise<any> {
    // Create an order for book purchase/rental
    return await this.createOrder({
      userId: order.userId,
      totalAmount: order.amount,
      status: order.status || 'completed',
      module: 'vyronaread',
      metadata: {
        bookId: order.bookId,
        action: order.action,
        type: 'book_order'
      }
    });
  }

  // Seed initial data when needed
  // Group Buy Products
  async createGroupBuyProduct(insertProduct: any): Promise<any> {
    const [product] = await db
      .insert(groupBuyProducts)
      .values(insertProduct)
      .returning();
    return product;
  }

  async getGroupBuyProducts(sellerId?: number): Promise<any[]> {
    if (sellerId) {
      return await db.select().from(groupBuyProducts).where(eq(groupBuyProducts.sellerId, sellerId));
    }
    return await db.select().from(groupBuyProducts);
  }

  async approveGroupBuyProduct(id: number, approvedBy: number): Promise<any | undefined> {
    const [product] = await db
      .update(groupBuyProducts)
      .set({ isApproved: true, approvedBy, approvedAt: new Date() })
      .where(eq(groupBuyProducts.id, id))
      .returning();
    return product;
  }

  async getApprovedGroupBuyProducts(): Promise<any[]> {
    return await db.select().from(groupBuyProducts).where(eq(groupBuyProducts.isApproved, true));
  }

  // Group Buy Campaigns
  async createGroupBuyCampaign(insertCampaign: any): Promise<any> {
    const [campaign] = await db
      .insert(groupBuyCampaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async getGroupBuyCampaigns(userId?: number): Promise<any[]> {
    if (userId) {
      return await db.select().from(groupBuyCampaigns).where(eq(groupBuyCampaigns.createdBy, userId));
    }
    return await db.select().from(groupBuyCampaigns);
  }

  async getGroupBuyCampaign(id: number): Promise<any | undefined> {
    const [campaign] = await db.select().from(groupBuyCampaigns).where(eq(groupBuyCampaigns.id, id));
    return campaign;
  }

  async updateCampaignQuantity(id: number, quantity: number): Promise<void> {
    await db
      .update(groupBuyCampaigns)
      .set({ currentQuantity: quantity })
      .where(eq(groupBuyCampaigns.id, id));
  }

  // Group Buy Participants
  async joinGroupBuyCampaign(insertParticipant: any): Promise<any> {
    const [participant] = await db
      .insert(groupBuyParticipants)
      .values(insertParticipant)
      .returning();
    return participant;
  }

  async getGroupBuyParticipants(campaignId: number): Promise<any[]> {
    return await db.select().from(groupBuyParticipants).where(eq(groupBuyParticipants.campaignId, campaignId));
  }

  async updateParticipantStatus(id: number, status: string): Promise<void> {
    await db
      .update(groupBuyParticipants)
      .set({ status })
      .where(eq(groupBuyParticipants.id, id));
  }

  async seedInitialData(): Promise<void> {
    // Check if admin account exists, if not create it
    const existingAdmin = await this.getUserByEmail("mgmags25@gmail.com");
    
    if (!existingAdmin) {
      // Create admin account
      await this.createUser({
        username: "admin",
        email: "mgmags25@gmail.com",
        mobile: null,
        password: "12345678",
        role: "admin",
        vyronaCoins: 1000,
        xp: 0,
        level: 1,
        isActive: true,
        isVerified: true
      });
      console.log("Admin account created for mgmags25@gmail.com");
    } else if (existingAdmin.role !== "admin") {
      // Upgrade existing account to admin
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.email, "mgmags25@gmail.com"));
      console.log("Existing account upgraded to admin for mgmags25@gmail.com");
    }

    // Create seller account for VyronaSocial testing
    const existingSeller = await this.getUserByEmail("seller@test.com");
    if (!existingSeller) {
      await this.createUser({
        username: "testseller",
        email: "seller@test.com",
        mobile: null,
        password: "12345678",
        role: "seller",
        vyronaCoins: 500,
        xp: 0,
        level: 1,
        isActive: true,
        isVerified: true
      });
      console.log("Seller account created for VyronaSocial testing");
    }

    // Add sample products for VyronaSocial testing
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0) {
      const sampleProducts = [
        {
          name: "Premium Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation",
          price: 2500,
          category: "electronics",
          module: "social",
          imageUrl: null,
          storeId: null,
          metadata: {}
        },
        {
          name: "Organic Cotton T-Shirt",
          description: "Comfortable and sustainable organic cotton t-shirt",
          price: 1200,
          category: "fashion",
          module: "social",
          imageUrl: null,
          storeId: null,
          metadata: {}
        }
      ];

      for (const product of sampleProducts) {
        await db.insert(products).values(product);
      }
      console.log("Sample products created for VyronaSocial testing");

      // Create sample group buy products with valid seller ID
      const productsList = await db.select().from(products);
      const seller = await this.getUserByEmail("seller@test.com");
      
      if (productsList.length > 0 && seller) {
        const groupBuyData = [
          {
            productId: productsList[0].id,
            sellerId: seller.id,
            isApproved: true,
            minQuantity: 10,
            groupBuyPrice: 1875,
            originalPrice: 2500,
            discountPercentage: 25,
            isActive: true,
            approvedAt: new Date(),
            createdAt: new Date()
          }
        ];

        for (const groupBuy of groupBuyData) {
          await db.insert(groupBuyProducts).values(groupBuy);
        }
        console.log("Sample group buy products created for VyronaSocial testing");
      }

      // Create sample shopping groups/rooms
      const sampleGroups = [
        {
          name: "Fashion Friday Deals",
          description: "Weekly fashion shopping with friends",
          category: "fashion",
          privacy: "public",
          creatorId: adminUser.id,
          isActive: true,
          memberCount: 4,
          totalCart: 150,
          currentGame: null,
          roomCode: "FF2024",
          createdAt: new Date()
        },
        {
          name: "Tech Enthusiasts",
          description: "Latest gadgets and electronics",
          category: "electronics", 
          privacy: "public",
          creatorId: adminUser.id,
          isActive: true,
          memberCount: 6,
          totalCart: 850,
          currentGame: "product_voting",
          roomCode: "TECH99",
          createdAt: new Date()
        },
        {
          name: "Book Club Picks",
          description: "Monthly book selections",
          category: "books",
          privacy: "private",
          creatorId: adminUser.id,
          isActive: true,
          memberCount: 3,
          totalCart: 75,
          currentGame: null,
          roomCode: "BOOK88",
          createdAt: new Date()
        }
      ];

      for (const group of sampleGroups) {
        await db.insert(shoppingGroups).values(group);
      }
      console.log("Sample shopping groups created for VyronaSocial testing");

      // Get created groups to add members and messages
      const createdGroups = await db.select().from(shoppingGroups);
      
      if (createdGroups.length > 0) {
        // Add group members
        const sampleMembers = [
          {
            groupId: createdGroups[0].id,
            userId: adminUser.id,
            role: "creator",
            joinedAt: new Date()
          },
          {
            groupId: createdGroups[0].id,
            userId: seller.id,
            role: "member", 
            joinedAt: new Date()
          },
          {
            groupId: createdGroups[1].id,
            userId: adminUser.id,
            role: "creator",
            joinedAt: new Date()
          },
          {
            groupId: createdGroups[1].id,
            userId: seller.id,
            role: "member",
            joinedAt: new Date()
          }
        ];

        for (const member of sampleMembers) {
          await db.insert(groupMembers).values(member);
        }
        console.log("Sample group members created for VyronaSocial testing");

        // Add group messages
        const sampleMessages = [
          {
            groupId: createdGroups[0].id,
            userId: adminUser.id,
            content: "Welcome to Fashion Friday Deals! Let's find some great fashion items together.",
            sentAt: new Date(Date.now() - 3600000) // 1 hour ago
          },
          {
            groupId: createdGroups[0].id,
            userId: seller.id,
            content: "I found some amazing organic cotton t-shirts. What do you think?",
            sentAt: new Date(Date.now() - 1800000) // 30 minutes ago
          },
          {
            groupId: createdGroups[1].id,
            userId: adminUser.id,
            content: "Tech Enthusiasts assemble! Looking for premium wireless headphones.",
            sentAt: new Date(Date.now() - 7200000) // 2 hours ago
          },
          {
            groupId: createdGroups[1].id,
            userId: seller.id,
            content: "I have the perfect headphones in stock with group discounts available!",
            sentAt: new Date(Date.now() - 3600000) // 1 hour ago
          }
        ];

        for (const message of sampleMessages) {
          await db.insert(groupMessages).values(message);
        }
        console.log("Sample group messages created for VyronaSocial testing");

        // Add some cart items for rooms
        if (productsList.length > 0) {
          const sampleCartItems = [
            {
              productId: productsList[1].id, // Organic Cotton T-Shirt
              userId: adminUser.id,
              quantity: 2,
              roomId: createdGroups[0].id
            },
            {
              productId: productsList[0].id, // Premium Wireless Headphones
              userId: seller.id,
              quantity: 1,
              roomId: createdGroups[1].id
            }
          ];

          for (const cartItem of sampleCartItems) {
            await db.insert(cartItems).values(cartItem);
          }
          console.log("Sample cart items created for VyronaSocial testing");
        }

        // Add sample notifications
        const sampleNotifications = [
          {
            userId: adminUser.id,
            type: "group_invite",
            title: "New Room Invitation",
            content: "You've been invited to join 'Weekend Shopping Spree'",
            isRead: false,
            createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
          },
          {
            userId: adminUser.id,
            type: "group_message",
            title: "New Message in Tech Enthusiasts",
            content: "Someone added a product to the shared cart",
            isRead: false,
            createdAt: new Date(Date.now() - 900000) // 15 minutes ago
          }
        ];

        for (const notification of sampleNotifications) {
          await db.insert(notifications).values(notification);
        }
        console.log("Sample notifications created for VyronaSocial testing");
      }
    }
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
