import { 
  users, products, stores, shoppingRooms, cartItems, orders, achievements, gameScores, otpVerifications,
  shoppingGroups, groupMembers, groupWishlists, groupMessages, productShares, notifications,
  instagramStores, instagramProducts, instagramOrders, instagramAnalytics,
  groupBuyProducts, groupBuyCampaigns, groupBuyParticipants, groupCarts, groupCartContributions,
  libraryIntegrationRequests, physicalBooks, eBooks, bookLoans,
  type User, type InsertUser, type Product, type InsertProduct, 
  type Store, type InsertStore, type ShoppingRoom, type InsertShoppingRoom,
  type CartItem, type InsertCartItem, type Order, type InsertOrder,
  type Achievement, type InsertAchievement, type GameScore, type InsertGameScore,
  type OtpVerification, type InsertOtpVerification,
  type ShoppingGroup, type InsertShoppingGroup, type GroupMember, type InsertGroupMember,
  type GroupWishlist, type InsertGroupWishlist, type GroupMessage, type InsertGroupMessage,
  type ProductShare, type InsertProductShare, type Notification, type InsertNotification,
  type GroupCart, type InsertGroupCart, type GroupCartContribution, type InsertGroupCartContribution,
  type InstagramStore, type InsertInstagramStore, type InstagramProduct, type InsertInstagramProduct,
  type InstagramOrder, type InsertInstagramOrder, type InstagramAnalytics, type InsertInstagramAnalytics,
  type GroupBuyProduct, type InsertGroupBuyProduct, type GroupBuyCampaign, type InsertGroupBuyCampaign,
  type GroupBuyParticipant, type InsertGroupBuyParticipant,
  type LibraryIntegrationRequest, type InsertLibraryIntegrationRequest,
  type PhysicalBook, type InsertPhysicalBook, type EBook, type InsertEBook,
  type BookLoan, type InsertBookLoan
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, isNull, sql, desc } from "drizzle-orm";

// Wallet tables will be handled through the existing wallet implementation

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
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
  updateProductListing(id: number, listing: {
    enableIndividualBuy?: boolean;
    enableGroupBuy?: boolean;
    groupBuyMinQuantity?: number;
    groupBuyDiscount?: number;
  }): Promise<Product>;

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
  getCartItem(id: number): Promise<CartItem | undefined>;
  addCartItem(item: InsertCartItem): Promise<CartItem>;
  removeCartItem(id: number): Promise<boolean>;
  updateCartItemQuantity(cartItemId: number, quantity: number): Promise<CartItem>;
  
  // Room-specific cart operations
  getRoomCartItems(roomId: number): Promise<CartItem[]>;
  getSharedCartItems(roomId: number): Promise<CartItem[]>;
  addSharedCartItem(item: InsertCartItem): Promise<CartItem>;
  removeSharedCartItem(roomId: number, itemId: number): Promise<boolean>;
  isUserRoomMember(userId: number, roomId: number): Promise<boolean>;

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
  deleteShoppingGroup(id: number): Promise<boolean>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  removeGroupMember(groupId: number, userId: number): Promise<boolean>;
  removeUserFromGroup(userId: number, groupId: number): Promise<boolean>;

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

  // VyronaSocial - Group Carts
  createGroupCart(groupCart: InsertGroupCart): Promise<GroupCart>;
  getActiveGroupCartsByProduct(productId: number): Promise<GroupCart[]>;
  joinGroupCart(contribution: InsertGroupCartContribution): Promise<GroupCartContribution>;
  getGroupCartContributions(groupCartId: number): Promise<GroupCartContribution[]>;
  getShoppingRoomCartItems(roomId: number): Promise<any[]>;

  // VyronaSocial - Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;

  // VyronaWallet - Wallet Management
  getOrCreateVyronaWallet(userId: number): Promise<any>;
  createWalletTransaction(transaction: any): Promise<any>;
  getWalletTransactions(userId: number): Promise<any[]>;

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
  getLibraryIntegrationRequestById(id: number): Promise<LibraryIntegrationRequest | undefined>;
  updateLibraryIntegrationRequestStatus(id: number, status: string, processedBy: number, adminNotes?: string): Promise<LibraryIntegrationRequest | undefined>;
  deleteLibraryIntegrationRequest(id: number): Promise<boolean>;
  deleteLibraryBooks(libraryId: number): Promise<boolean>;

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

  // Book Rental System
  createBookRental(rental: any): Promise<any>;
  getUserRentals(userId: number): Promise<any[]>;
  updateRentalStatus(rentalId: number, status: string): Promise<any>;
  updateRentalReturnRequest(rentalId: number, returnRequestId: number): Promise<any>;
  createRentalBilling(billing: any): Promise<any>;
  createReturnRequest(request: any): Promise<any>;
  getAllReturnRequests(): Promise<any[]>;
  getSellerRentals(sellerId: number): Promise<any[]>;
  getSellerReturnRequests(sellerId: number): Promise<any[]>;
  updateReturnRequest(requestId: number, updates: any): Promise<any>;
  
  // Library Management
  getLibraries(): Promise<any[]>;
  getLibraryBooks(libraryId?: number): Promise<any[]>;
  createLibraryMembership(membershipData: any): Promise<any>;
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
        enableIndividualBuy: true,
        enableGroupBuy: false,
        groupBuyMinQuantity: null,
        groupBuyDiscount: null,
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
        enableIndividualBuy: true,
        enableGroupBuy: false,
        groupBuyMinQuantity: null,
        groupBuyDiscount: null,
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
        enableIndividualBuy: true,
        enableGroupBuy: false,
        groupBuyMinQuantity: null,
        groupBuyDiscount: null,
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
        enableIndividualBuy: true,
        enableGroupBuy: false,
        groupBuyMinQuantity: null,
        groupBuyDiscount: null,
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

      // No sample shopping rooms - users create their own authentic rooms
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
      id: this.currentUserId++,
      username: insertUser.username,
      email: insertUser.email,
      mobile: insertUser.mobile || null,
      password: insertUser.password,
      role: insertUser.role || "user",
      vyronaCoins: insertUser.vyronaCoins || 100,
      xp: insertUser.xp || 0,
      level: insertUser.level || 1,
      isActive: insertUser.isActive || true,
      isVerified: insertUser.isVerified || false,
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
      id: this.currentProductId++,
      name: insertProduct.name,
      description: insertProduct.description || null,
      price: insertProduct.price,
      category: insertProduct.category,
      module: insertProduct.module,
      imageUrl: insertProduct.imageUrl || null,
      storeId: insertProduct.storeId || null,
      metadata: insertProduct.metadata || null,
      enableIndividualBuy: insertProduct.enableIndividualBuy || true,
      enableGroupBuy: insertProduct.enableGroupBuy || false,
      groupBuyMinQuantity: insertProduct.groupBuyMinQuantity || null,
      groupBuyDiscount: insertProduct.groupBuyDiscount || null,
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
      id: this.currentStoreId++,
      name: insertStore.name,
      type: insertStore.type,
      address: insertStore.address || null,
      latitude: insertStore.latitude || null,
      longitude: insertStore.longitude || null,
      isOpen: insertStore.isOpen || true,
      rating: insertStore.rating || null,
      reviewCount: insertStore.reviewCount || null,
    };
    this.stores.set(store.id, store);
    return store;
  }

  // Shopping Room methods
  async getShoppingRooms(): Promise<ShoppingRoom[]> {
    return Array.from(this.shoppingRooms.values()).filter(room => room.isActive !== false);
  }

  async getShoppingRoom(id: number): Promise<ShoppingRoom | undefined> {
    return this.shoppingRooms.get(id);
  }

  async createShoppingRoom(insertRoom: InsertShoppingRoom): Promise<ShoppingRoom> {
    const room: ShoppingRoom = {
      id: this.currentRoomId++,
      name: insertRoom.name,
      isActive: insertRoom.isActive || true,
      createdAt: new Date(),
      description: insertRoom.description || null,
      creatorId: insertRoom.creatorId,
      currentGame: insertRoom.currentGame || null,
      totalCart: insertRoom.totalCart || null,
      maxMembers: insertRoom.maxMembers || null,
      roomCode: insertRoom.roomCode || null,
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
      id: this.currentCartId++,
      userId: insertItem.userId,
      productId: insertItem.productId,
      quantity: insertItem.quantity || 1,
      roomId: insertItem.roomId || null,
      addedAt: new Date(),
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
      id: this.currentOrderId++,
      userId: insertOrder.userId,
      totalAmount: insertOrder.totalAmount,
      status: insertOrder.status || "pending",
      module: insertOrder.module,
      metadata: insertOrder.metadata || null,
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
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
    try {
      // Use raw SQL to properly handle decimal conversion
      let whereClause = '';
      const params: any[] = [];
      
      if (module && category) {
        whereClause = 'WHERE module = $1 AND category = $2';
        params.push(module, category);
      } else if (module) {
        whereClause = 'WHERE module = $1';
        params.push(module);
      } else if (category) {
        whereClause = 'WHERE category = $1';
        params.push(category);
      }
      
      const query = `
        SELECT 
          id, 
          name, 
          description, 
          TO_CHAR(ROUND(price::NUMERIC, 2), 'FM999999999999990.00') as price_string,
          category, 
          module, 
          image_url as "imageUrl", 
          store_id as "storeId", 
          metadata, 
          enable_individual_buy as "enableIndividualBuy", 
          enable_group_buy as "enableGroupBuy", 
          group_buy_min_quantity as "groupBuyMinQuantity", 
          group_buy_discount as "groupBuyDiscount"
        FROM products 
        ${whereClause}
      `;
      
      const result = await pool.query(query, params);
      
      // Convert price strings to proper decimal numbers
      return result.rows.map((row: any) => {
        const { price_string, ...productData } = row;
        return {
          ...productData,
          price: parseFloat(price_string)
        };
      }) as Product[];
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return undefined;
    
    // Convert price from string/decimal to proper number format
    return {
      ...product,
      price: parseFloat(product.price.toString())
    };
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProductListing(id: number, listing: {
    enableIndividualBuy?: boolean;
    enableGroupBuy?: boolean;
    groupBuyMinQuantity?: number;
    groupBuyDiscount?: number;
  }): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        enableIndividualBuy: listing.enableIndividualBuy,
        enableGroupBuy: listing.enableGroupBuy,
        groupBuyMinQuantity: listing.groupBuyMinQuantity,
        groupBuyDiscount: listing.groupBuyDiscount
      })
      .where(eq(products.id, id))
      .returning();
    
    if (!updatedProduct) {
      throw new Error("Product not found");
    }
    
    return updatedProduct;
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
      // For room carts, return all items in the room (shared cart)
      return await db.select().from(cartItems)
        .where(eq(cartItems.roomId, roomId));
    }
    // For personal carts, filter by user ID
    return await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, userId), isNull(cartItems.roomId)));
  }

  async addCartItem(insertItem: InsertCartItem): Promise<CartItem> {
    console.log("=== ADDING CART ITEM ===");
    console.log("Insert data:", JSON.stringify(insertItem, null, 2));
    
    const [item] = await db
      .insert(cartItems)
      .values(insertItem)
      .returning();
    
    console.log("Cart item added successfully:", JSON.stringify(item, null, 2));
    console.log("=== CART ITEM ADDED ===");
    
    return item;
  }

  // Shared Cart - Room-specific operations
  async getSharedCartItems(roomId: number): Promise<CartItem[]> {
    console.log(`=== GETTING SHARED CART ITEMS FOR ROOM ${roomId} ===`);
    
    const items = await db.select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      roomId: cartItems.roomId,
      addedAt: cartItems.addedAt,
      productName: products.name,
      productPrice: products.price,
      productImageUrl: products.imageUrl,
      productDescription: products.description
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.roomId, roomId));

    console.log(`=== SHARED CART ITEMS QUERY RESULT FOR ROOM ${roomId} ===`, items);
    console.log(`Found ${items.length} cart items for room ${roomId}`);

    const mappedItems = items.map(item => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      quantity: item.quantity,
      roomId: item.roomId,
      addedAt: item.addedAt,
      product: {
        id: item.productId,
        name: item.productName || 'Unknown Product',
        price: item.productPrice || 0,
        imageUrl: item.productImageUrl || null,
        description: item.productDescription || null
      }
    }));

    console.log(`=== MAPPED CART ITEMS ===`, JSON.stringify(mappedItems, null, 2));
    return mappedItems;
  }

  async addSharedCartItem(item: InsertCartItem): Promise<CartItem> {
    const [cartItem] = await db
      .insert(cartItems)
      .values(item)
      .returning();
    
    // Update room total cart value
    if (item.roomId) {
      await this.updateRoomCartTotal(item.roomId);
    }
    
    return cartItem;
  }

  async removeSharedCartItem(roomId: number, itemId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.roomId, roomId)));
    
    // Update room total cart value
    await this.updateRoomCartTotal(roomId);
    
    return true;
  }

  async isUserRoomMember(userId: number, roomId: number): Promise<boolean> {
    // Check if user is room creator
    const room = await db.select().from(shoppingGroups)
      .where(eq(shoppingGroups.id, roomId))
      .limit(1);
    
    if (room.length > 0 && room[0].creatorId === userId) {
      return true;
    }
    
    // Check if user is added as member
    const membership = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, roomId), eq(groupMembers.userId, userId)))
      .limit(1);
    
    return membership.length > 0;
  }

  async updateRoomCartTotal(roomId: number): Promise<void> {
    // Calculate total cart value for the room
    const cartItemsWithProducts = await db
      .select({
        quantity: cartItems.quantity,
        price: products.price
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.roomId, roomId));

    const totalCart = cartItemsWithProducts.reduce((total, item) => {
      return total + (item.quantity * (item.price || 0));
    }, 0);

    console.log(`=== UPDATING ROOM ${roomId} CART TOTAL TO ${totalCart} ===`);

    // Update the shopping group's total cart value using direct SQL
    await pool.query(
      'UPDATE shopping_groups SET total_cart = $1 WHERE id = $2',
      [totalCart, roomId]
    );
  }

  async getCartItem(id: number): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
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
    try {
      console.log("=== STORAGE: Creating shopping group ===");
      console.log("Input data:", JSON.stringify(insertGroup, null, 2));
      
      // Generate room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Use direct SQL to ensure successful creation
      const groupResult = await pool.query(`
        INSERT INTO shopping_groups (name, description, creator_id, is_active, max_members, room_code, created_at, total_cart)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0)
        RETURNING *
      `, [
        insertGroup.name,
        insertGroup.description,
        insertGroup.creatorId,
        true,
        insertGroup.maxMembers || 10,
        roomCode
      ]);
      
      const group = groupResult.rows[0];
      console.log("Group created successfully:", JSON.stringify(group, null, 2));
      
      // Add creator as group member
      const memberResult = await pool.query(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `, [group.id, insertGroup.creatorId, 'creator']);
      
      console.log("Group member added successfully:", memberResult.rows[0]);
      
      // Return group with all required ShoppingGroup fields
      const result = {
        id: group.id,
        name: group.name,
        description: group.description || '',
        category: "general",
        privacy: "public",
        creatorId: group.creator_id,
        isActive: group.is_active,
        memberCount: 1,
        totalCart: group.total_cart || 0,
        currentGame: null,
        roomCode: group.room_code,
        scheduledTime: null,
        maxMembers: group.max_members,
        createdAt: group.created_at
      };
      
      console.log("Returning result:", JSON.stringify(result, null, 2));
      console.log("=== STORAGE: Shopping group creation completed ===");
      
      return result;
    } catch (error: any) {
      console.error("=== STORAGE ERROR ===");
      console.error("Error in createShoppingGroup:", error);
      console.error("Error message:", error?.message);
      console.error("Error code:", error?.code);
      console.error("Error details:", error?.detail);
      console.error("Stack trace:", error?.stack);
      console.error("=== END STORAGE ERROR ===");
      throw error;
    }
  }

  async getShoppingGroups(userId: number): Promise<ShoppingGroup[]> {
    try {
      console.log("=== STORAGE: getShoppingGroups called ===");
      console.log("User ID:", userId);
      
      // Use direct SQL query that matches VyronaSocial API pattern
      // Filter to only show rooms where the user is a member
      const result = await pool.query(`
        SELECT sg.*, 
               (SELECT COUNT(*) FROM group_members WHERE group_id = sg.id) as member_count,
               (SELECT COALESCE(SUM(ci.quantity * p.price), 0) 
                FROM cart_items ci 
                LEFT JOIN products p ON ci.product_id = p.id 
                WHERE ci.room_id = sg.id) as total_cart
        FROM shopping_groups sg
        INNER JOIN group_members gm_user ON sg.id = gm_user.group_id AND gm_user.user_id = $1
        WHERE sg.is_active = true
        ORDER BY sg.created_at DESC
      `, [userId]);
      
      console.log("SQL Query result:", result.rows);
      
      const groups = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        category: 'general',
        privacy: 'public',
        creatorId: row.creator_id,
        isActive: row.is_active,
        memberCount: parseInt(row.member_count) || 0,
        totalCart: Number(row.total_cart) || 0,
        currentGame: null,
        roomCode: row.room_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
        scheduledTime: null,
        maxMembers: row.max_members,
        createdAt: row.created_at
      }));
      
      console.log("Transformed groups:", groups);
      return groups;
    } catch (error) {
      console.error("Error in getShoppingGroups:", error);
      return [];
    }
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

  async getGroupMembers(groupId: number): Promise<any[]> {
    return await db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        groupId: groupMembers.groupId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        username: users.username,
        email: users.email
      })
      .from(groupMembers)
      .leftJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));
  }

  async removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteShoppingGroup(id: number): Promise<boolean> {
    try {
      // Delete group members first (foreign key constraint)
      await db.delete(groupMembers).where(eq(groupMembers.groupId, id));
      
      // Delete group messages
      await db.delete(groupMessages).where(eq(groupMessages.groupId, id));
      
      // Delete group wishlists (skip if table doesn't exist)
      try {
        await db.delete(groupWishlists).where(eq(groupWishlists.groupId, id));
      } catch (wishlistError: any) {
        if (wishlistError.code !== '42P01') { // If not "table doesn't exist" error
          throw wishlistError;
        }
      }
      
      // Delete cart items for this group
      await db.delete(cartItems).where(eq(cartItems.roomId, id));
      
      // Finally delete the group
      const result = await db.delete(shoppingGroups).where(eq(shoppingGroups.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting shopping group:", error);
      return false;
    }
  }

  async removeUserFromGroup(userId: number, groupId: number): Promise<boolean> {
    const result = await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.groupId, groupId)));
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
      .values({
        userId: insertMessage.userId,
        groupId: insertMessage.groupId,
        content: insertMessage.content,
        messageType: insertMessage.messageType || 'text',
        metadata: insertMessage.metadata || null
      })
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

  // VyronaSocial - Group Carts
  async createGroupCart(groupCartData: InsertGroupCart): Promise<GroupCart> {
    const [groupCart] = await db
      .insert(groupCarts)
      .values({
        ...groupCartData,
        totalQuantity: 0,
        currentPrice: groupCartData.targetPrice || 0,
        isActive: true,
        createdAt: new Date()
      })
      .returning();
    return groupCart;
  }

  async getActiveGroupCartsByProduct(productId: number): Promise<GroupCart[]> {
    return await db
      .select()
      .from(groupCarts)
      .where(and(
        eq(groupCarts.productId, productId),
        eq(groupCarts.isActive, true)
      ));
  }

  async joinGroupCart(contributionData: InsertGroupCartContribution): Promise<GroupCartContribution> {
    const [contribution] = await db
      .insert(groupCartContributions)
      .values({
        ...contributionData,
        joinedAt: new Date(),
        status: 'active'
      })
      .returning();

    // Update group cart total quantity
    await db
      .update(groupCarts)
      .set({ 
        totalQuantity: sql`${groupCarts.totalQuantity} + ${contributionData.quantity}` 
      })
      .where(eq(groupCarts.id, contributionData.groupCartId));

    return contribution;
  }

  async getGroupCartContributions(groupCartId: number): Promise<GroupCartContribution[]> {
    return await db
      .select()
      .from(groupCartContributions)
      .where(eq(groupCartContributions.groupCartId, groupCartId));
  }

  async getShoppingRoomCartItems(roomId: number): Promise<any[]> {
    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        userId: cartItems.userId,
        name: products.name,
        price: products.price,
        imageUrl: products.imageUrl,
        description: products.description
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.roomId, roomId));
    
    return items;
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
    try {
      console.log("Database Storage: Creating physical book with data:", book);
      const [newBook] = await db
        .insert(physicalBooks)
        .values(book)
        .returning();
      console.log("Database Storage: Physical book created successfully:", newBook);
      return newBook;
    } catch (error) {
      console.error("Database Storage: Error creating physical book:", error);
      throw error;
    }
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
    try {
      if (sellerId) {
        return await db.select().from(eBooks).where(eq(eBooks.sellerId, sellerId));
      }
      return await db.select().from(eBooks);
    } catch (error) {
      console.error("Error fetching e-books:", error);
      return [];
    }
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
    // Check if CSV books data exists
    if (libraryData.booksListCsv && Array.isArray(libraryData.booksListCsv) && libraryData.booksListCsv.length > 0) {
      console.log(`Creating ${libraryData.booksListCsv.length} books from CSV data for library ${libraryData.libraryName}`);
      
      // Create physical books from CSV data
      for (const csvBook of libraryData.booksListCsv) {
        const physicalBook = {
          title: csvBook.bookName || "Unknown Title",
          author: csvBook.author || "Unknown Author",
          isbn: csvBook.isbn || "",
          genre: "General", // Default genre since not in CSV
          condition: "New",
          price: 0, // Default price for library books
          availability: "Available",
          libraryId: requestId,
          publisher: "Unknown Publisher",
          publicationYear: parseInt(csvBook.yearOfPublish) || new Date().getFullYear(),
          language: "English",
          pages: 200, // Default page count
          isAvailable: true,
          edition: csvBook.edition || "1st Edition"
        };

        try {
          await this.createPhysicalBook(physicalBook);
          console.log(`Created book: ${physicalBook.title} by ${physicalBook.author}`);
        } catch (error) {
          console.error(`Error creating book ${physicalBook.title}:`, error);
        }
      }
    } else {
      console.log("No CSV books data found, creating sample books for library", libraryData.libraryName);
      
      // Fallback: Create sample books if no CSV data
      const sampleBooks = [
        {
          title: `${libraryData.libraryName} - Sample Book 1`,
          isbn: `978-0-${Math.floor(Math.random() * 1000000)}`,
          author: "Library Author",
          publisher: "Library Publications",
          publicationYear: 2023,
          genre: "General",
          language: "English",
          pages: 200,
          condition: "New",
          price: 0,
          isAvailable: true,
          libraryId: requestId,
          availability: "Available"
        }
      ];

      for (const book of sampleBooks) {
        await this.createPhysicalBook(book);
      }
    }
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

        // Add VyronaRead sample data for testing
        
        // 1. Physical Books for Browse Books section
        const samplePhysicalBooks = [
          {
            title: "The Psychology of Money",
            author: "Morgan Housel",
            isbn: "9780857197689",
            genre: "Finance",
            condition: "New",
            price: 89900, // ₹899
            availability: "Available",
            sellerId: seller.id
          },
          {
            title: "Atomic Habits",
            author: "James Clear", 
            isbn: "9780735211292",
            genre: "Self-Help",
            condition: "Like New",
            price: 79900, // ₹799
            availability: "Available",
            sellerId: seller.id
          },
          {
            title: "The Silent Patient",
            author: "Alex Michaelides",
            isbn: "9781250301697",
            genre: "Thriller",
            condition: "Good",
            price: 69900, // ₹699
            availability: "Available", 
            sellerId: seller.id
          }
        ];

        // Add to products table for Browse Books section
        const physicalBookProducts = samplePhysicalBooks.map(book => ({
          name: book.title,
          description: `${book.author} - ${book.genre} book in ${book.condition} condition`,
          price: book.price,
          category: "books",
          module: "vyronaread",
          metadata: {
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            condition: book.condition,
            availability: book.availability,
            sellerId: book.sellerId
          }
        }));

        for (const product of physicalBookProducts) {
          await db.insert(products).values(product);
        }
        console.log("Sample physical books added to products for Browse Books section");

        // 2. E-Books for VyronaRead E-Reader section
        const sampleEBooks = [
          {
            title: "Digital Minimalism",
            author: "Cal Newport",
            isbn: "9780525536512",
            genre: "Technology",
            fileSize: "2.8MB",
            format: "PDF",
            price: 59900, // ₹599
            sellerId: seller.id
          },
          {
            title: "The Lean Startup", 
            author: "Eric Ries",
            isbn: "9780307887894",
            genre: "Business",
            fileSize: "3.2MB",
            format: "EPUB",
            price: 49900, // ₹499
            sellerId: seller.id
          },
          {
            title: "Sapiens",
            author: "Yuval Noah Harari",
            isbn: "9780062316097", 
            genre: "History",
            fileSize: "4.1MB",
            format: "PDF",
            price: 79900, // ₹799
            sellerId: seller.id
          }
        ];

        // Add e-books to products table for E-Reader section
        const eBookProducts = sampleEBooks.map(ebook => ({
          name: ebook.title,
          description: `${ebook.author} - Digital ${ebook.genre} book in ${ebook.format} format`,
          price: ebook.price,
          category: "ebooks",
          module: "vyronaread",
          metadata: {
            author: ebook.author,
            isbn: ebook.isbn,
            genre: ebook.genre,
            fileSize: ebook.fileSize,
            format: ebook.format,
            sellerId: ebook.sellerId
          }
        }));

        for (const product of eBookProducts) {
          await db.insert(products).values(product);
        }
        console.log("Sample e-books added to products for VyronaRead E-Reader section");

        // 3. Library Integration Requests (approved by admin)
        const sampleLibraryRequests = [
          {
            sellerId: seller.id,
            libraryName: "City Central Library",
            libraryType: "public",
            address: "123 Main Street, Delhi",
            contactPerson: "Dr. Sarah Johnson",
            email: "sarah@citylibrary.org",
            phone: "+91-9876543210",
            description: "Expanding digital collection with contemporary fiction and non-fiction titles",
            status: "approved"
          },
          {
            sellerId: seller.id,
            libraryName: "University Research Library",
            libraryType: "academic",
            address: "456 Campus Road, Mumbai", 
            contactPerson: "Prof. Michael Chen",
            email: "mchen@university.edu",
            phone: "+91-9876543211",
            description: "Academic collection enhancement for students and researchers",
            status: "approved"
          }
        ];

        const createdLibraryRequests = [];
        for (const request of sampleLibraryRequests) {
          const [createdRequest] = await db.insert(libraryIntegrationRequests).values(request).returning();
          createdLibraryRequests.push(createdRequest);
        }
        console.log("Sample library integration requests created and approved");

        // 4. Sample orders for Currently Reading section
        const sampleOrders = [
          {
            userId: adminUser.id,
            module: "VyronaRead",
            totalAmount: 89900,
            status: "completed",
            metadata: {
              bookId: createdPhysicalBooks[0].id,
              bookTitle: "The Psychology of Money",
              orderType: "buy"
            }
          },
          {
            userId: adminUser.id, 
            module: "VyronaRead",
            totalAmount: 59900,
            status: "completed",
            metadata: {
              bookId: createdEBooks[0].id,
              bookTitle: "Digital Minimalism", 
              orderType: "ebook-access"
            }
          }
        ];

        for (const order of sampleOrders) {
          await db.insert(orders).values(order);
        }
        console.log("Sample VyronaRead orders created for Currently Reading section");

        // Add library books that customers can borrow through Library Integration
        const libraryBookProducts = [
          {
            name: "Pride and Prejudice",
            description: "Jane Austen - Classic Romance novel from City Central Library",
            price: 0, // Free borrowing
            category: "library-books",
            module: "vyronaread",
            metadata: {
              author: "Jane Austen",
              isbn: "9780141439518",
              genre: "Classic Literature",
              library: "City Central Library",
              availability: "Available for borrowing",
              libraryId: 1
            }
          },
          {
            name: "To Kill a Mockingbird",
            description: "Harper Lee - Classic American Literature from University Research Library",
            price: 0,
            category: "library-books", 
            module: "vyronaread",
            metadata: {
              author: "Harper Lee",
              isbn: "9780446310789",
              genre: "Classic Literature",
              library: "University Research Library",
              availability: "Available for borrowing",
              libraryId: 2
            }
          },
          {
            name: "1984",
            description: "George Orwell - Dystopian Fiction from City Central Library",
            price: 0,
            category: "library-books",
            module: "vyronaread", 
            metadata: {
              author: "George Orwell",
              isbn: "9780451524935",
              genre: "Dystopian Fiction",
              library: "City Central Library",
              availability: "Available for borrowing",
              libraryId: 1
            }
          }
        ];

        for (const product of libraryBookProducts) {
          await db.insert(products).values(product);
        }
        console.log("Sample library books added for Library Integration section");
      }
    }
  }

  async getLibraryIntegrationRequestById(id: number): Promise<any> {
    const [request] = await db
      .select()
      .from(libraryIntegrationRequests)
      .where(eq(libraryIntegrationRequests.id, id));
    return request;
  }

  // Delete Library Integration Request and associated books
  async deleteLibraryIntegrationRequest(id: number): Promise<boolean> {
    const result = await db
      .delete(libraryIntegrationRequests)
      .where(eq(libraryIntegrationRequests.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteLibraryBooks(libraryId: number): Promise<boolean> {
    // Delete from physical books table where libraryId matches
    const physicalBooksResult = await db
      .delete(physicalBooks)
      .where(eq(physicalBooks.libraryId, libraryId));
    
    // Delete from products table where metadata contains library info
    const productsResult = await db
      .delete(products)
      .where(sql`${products.metadata}->>'libraryId' = ${libraryId.toString()}`);
    
    return (physicalBooksResult.rowCount ?? 0) > 0 || (productsResult.rowCount ?? 0) > 0;
  }

  // Book Rental System Implementation
  async createBookRental(rental: any): Promise<any> {
    const [newRental] = await db.insert(bookRentals).values(rental).returning();
    return newRental;
  }

  async getUserRentals(userId: number): Promise<any[]> {
    const rentals = await db
      .select({
        id: bookRentals.id,
        userId: bookRentals.userId,
        productId: bookRentals.productId,
        bookType: bookRentals.bookType,
        rentalStartDate: bookRentals.rentalStartDate,
        currentBillingCycle: bookRentals.currentBillingCycle,
        nextBillingDate: bookRentals.nextBillingDate,
        rentalPricePerCycle: bookRentals.rentalPricePerCycle,
        totalAmountPaid: bookRentals.totalAmountPaid,
        status: bookRentals.status,
        returnRequestId: bookRentals.returnRequestId,
        productName: products.name,
        productImage: products.imageUrl,
        sellerName: users.username
      })
      .from(bookRentals)
      .leftJoin(products, eq(bookRentals.productId, products.id))
      .leftJoin(users, eq(bookRentals.sellerId, users.id))
      .where(eq(bookRentals.userId, userId))
      .orderBy(desc(bookRentals.createdAt));
    
    return rentals;
  }

  async updateRentalStatus(rentalId: number, status: string): Promise<any> {
    const [updatedRental] = await db
      .update(bookRentals)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookRentals.id, rentalId))
      .returning();
    return updatedRental;
  }

  async updateRentalReturnRequest(rentalId: number, returnRequestId: number): Promise<any> {
    const [updatedRental] = await db
      .update(bookRentals)
      .set({ returnRequestId, updatedAt: new Date() })
      .where(eq(bookRentals.id, rentalId))
      .returning();
    return updatedRental;
  }

  async createRentalBilling(billing: any): Promise<any> {
    const [newBilling] = await db.insert(rentalBillingHistory).values(billing).returning();
    return newBilling;
  }

  async createReturnRequest(request: any): Promise<any> {
    const [newRequest] = await db.insert(bookReturnRequests).values(request).returning();
    return newRequest;
  }

  async getAllReturnRequests(): Promise<any[]> {
    const requests = await db
      .select({
        id: bookReturnRequests.id,
        userId: bookReturnRequests.userId,
        rentalId: bookReturnRequests.rentalId,
        loanId: bookReturnRequests.loanId,
        bookType: bookReturnRequests.bookType,
        bookTitle: bookReturnRequests.bookTitle,
        returnReason: bookReturnRequests.returnReason,
        status: bookReturnRequests.status,
        requestDate: bookReturnRequests.requestDate,
        adminNotes: bookReturnRequests.adminNotes,
        sellerNotes: bookReturnRequests.sellerNotes,
        processedAt: bookReturnRequests.processedAt,
        userName: users.username,
        userEmail: users.email
      })
      .from(bookReturnRequests)
      .leftJoin(users, eq(bookReturnRequests.userId, users.id))
      .orderBy(desc(bookReturnRequests.requestDate));
    
    return requests;
  }

  async getSellerRentals(sellerId: number): Promise<any[]> {
    const rentals = await db
      .select({
        id: bookRentals.id,
        userId: bookRentals.userId,
        productId: bookRentals.productId,
        bookType: bookRentals.bookType,
        rentalStartDate: bookRentals.rentalStartDate,
        currentBillingCycle: bookRentals.currentBillingCycle,
        nextBillingDate: bookRentals.nextBillingDate,
        rentalPricePerCycle: bookRentals.rentalPricePerCycle,
        totalAmountPaid: bookRentals.totalAmountPaid,
        status: bookRentals.status,
        returnRequestId: bookRentals.returnRequestId,
        productName: products.name,
        productImage: products.imageUrl,
        customerName: users.username,
        customerEmail: users.email
      })
      .from(bookRentals)
      .leftJoin(products, eq(bookRentals.productId, products.id))
      .leftJoin(users, eq(bookRentals.userId, users.id))
      .where(eq(bookRentals.sellerId, sellerId))
      .orderBy(desc(bookRentals.createdAt));
    
    return rentals;
  }

  async getSellerReturnRequests(sellerId: number): Promise<any[]> {
    const requests = await db
      .select({
        id: bookReturnRequests.id,
        userId: bookReturnRequests.userId,
        rentalId: bookReturnRequests.rentalId,
        bookType: bookReturnRequests.bookType,
        bookTitle: bookReturnRequests.bookTitle,
        returnReason: bookReturnRequests.returnReason,
        status: bookReturnRequests.status,
        requestDate: bookReturnRequests.requestDate,
        sellerNotes: bookReturnRequests.sellerNotes,
        processedAt: bookReturnRequests.processedAt,
        userName: users.username,
        userEmail: users.email
      })
      .from(bookReturnRequests)
      .leftJoin(users, eq(bookReturnRequests.userId, users.id))
      .where(eq(bookReturnRequests.sellerId, sellerId))
      .orderBy(desc(bookReturnRequests.requestDate));
    
    return requests;
  }

  async updateReturnRequest(requestId: number, updates: any): Promise<any> {
    const [updatedRequest] = await db
      .update(bookReturnRequests)
      .set(updates)
      .where(eq(bookReturnRequests.id, requestId))
      .returning();
    return updatedRequest;
  }

  // Library Management Methods
  async getLibraries(): Promise<any[]> {
    const libraries = await db
      .select()
      .from(libraryIntegrationRequests)
      .where(eq(libraryIntegrationRequests.status, 'approved'));
    
    // Transform the data to match the expected format
    return libraries.map(library => ({
      id: library.id,
      name: library.library_name,
      type: library.library_type,
      address: library.address,
      contactEmail: library.email,
      contactPhone: library.phone,
      membershipFee: library.books_list_csv?.membershipFee || 50000,
      status: library.status,
      booksCount: library.books_list_csv?.booksUploaded || 0
    }));
  }

  async getLibraryBooks(libraryId?: number): Promise<any[]> {
    let query = db
      .select()
      .from(physicalBooks);

    if (libraryId) {
      query = query.where(eq(physicalBooks.libraryId, libraryId));
    }

    const books = await query.orderBy(physicalBooks.title);
    
    // Transform the data to match the expected format
    return books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher,
      publicationYear: book.publication_year,
      category: book.category,
      language: book.language,
      available: book.available,
      totalCopies: book.copies,
      location: book.location,
      libraryId: book.library_id
    }));
  }

  async createLibraryMembership(membershipData: any): Promise<any> {
    const membership = {
      fullName: membershipData.fullName,
      email: membershipData.email,
      phone: membershipData.phone,
      address: membershipData.address,
      idType: membershipData.idType,
      idNumber: membershipData.idNumber,
      emergencyContact: membershipData.emergencyContact,
      libraryId: membershipData.libraryId,
      bookId: membershipData.bookId,
      bookTitle: membershipData.bookTitle,
      membershipFee: membershipData.membershipFee,
      requestType: membershipData.requestType,
      status: 'pending',
      applicationDate: new Date(),
      userId: 1 // Default user ID, should come from session
    };

    // For now, we'll store in a notifications-like structure since we don't have a dedicated membership table
    const [newMembership] = await db.insert(notifications).values({
      userId: membership.libraryId,
      type: 'library_membership_request',
      title: 'New Library Membership Application',
      message: `Membership application from ${membership.fullName} for "${membership.bookTitle}"`,
      isRead: false,
      createdAt: new Date(),
      metadata: membership
    }).returning();

    return newMembership;
  }

  // VyronaRead Books - Required methods for authentic data
  async getAllEBooks(): Promise<any[]> {
    try {
      const ebooks = await db.select({
        id: eBooks.id,
        sellerId: eBooks.sellerId,
        title: eBooks.title,
        author: eBooks.author,
        isbn: eBooks.isbn,
        category: eBooks.category,
        format: eBooks.format,
        fileUrl: eBooks.fileUrl,
        fileSize: eBooks.fileSize,
        salePrice: eBooks.salePrice,
        rentalPrice: eBooks.rentalPrice,
        description: eBooks.description,
        publisher: eBooks.publisher,
        publicationYear: eBooks.publicationYear,
        language: eBooks.language,
        status: eBooks.status,
        downloads: eBooks.downloads,
        createdAt: eBooks.createdAt,
        updatedAt: eBooks.updatedAt
      }).from(eBooks).where(eq(eBooks.isActive, true));
      return ebooks || [];
    } catch (error) {
      console.error("Error fetching e-books:", error);
      return [];
    }
  }

  async getAllPhysicalBooks(): Promise<any[]> {
    const books = await db.select({
      id: physicalBooks.id,
      libraryId: physicalBooks.libraryId,
      title: physicalBooks.title,
      author: physicalBooks.author,
      isbn: physicalBooks.isbn,
      category: physicalBooks.category,
      copies: physicalBooks.copies,
      available: physicalBooks.available,
      publisher: physicalBooks.publisher,
      publicationYear: physicalBooks.publicationYear,
      language: physicalBooks.language,
      createdAt: physicalBooks.createdAt
    }).from(physicalBooks);
    return books;
  }

  async getPhysicalBooksByLibrary(libraryId: number): Promise<any[]> {
    const books = await db.select({
      id: physicalBooks.id,
      libraryId: physicalBooks.libraryId,
      title: physicalBooks.title,
      author: physicalBooks.author,
      isbn: physicalBooks.isbn,
      category: physicalBooks.category,
      copies: physicalBooks.copies,
      available: physicalBooks.available,
      publisher: physicalBooks.publisher,
      publicationYear: physicalBooks.publicationYear,
      language: physicalBooks.language,
      createdAt: physicalBooks.createdAt
    }).from(physicalBooks).where(eq(physicalBooks.libraryId, libraryId));
    return books;
  }

  async deletePhysicalBook(bookId: number): Promise<boolean> {
    try {
      const result = await db.delete(physicalBooks).where(eq(physicalBooks.id, bookId));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting physical book:", error);
      return false;
    }
  }

  async getPhysicalBooksBySeller(sellerId: number): Promise<any[]> {
    try {
      const books = await db.select({
        id: physicalBooks.id,
        libraryId: physicalBooks.libraryId,
        title: physicalBooks.title,
        author: physicalBooks.author,
        isbn: physicalBooks.isbn,
        category: physicalBooks.category,
        copies: physicalBooks.copies,
        available: physicalBooks.available,
        publisher: physicalBooks.publisher,
        publicationYear: physicalBooks.publicationYear,
        language: physicalBooks.language,
        createdAt: physicalBooks.createdAt
      })
      .from(physicalBooks)
      .innerJoin(libraryIntegrationRequests, eq(physicalBooks.libraryId, libraryIntegrationRequests.id))
      .where(eq(libraryIntegrationRequests.sellerId, sellerId));
      
      return books;
    } catch (error) {
      console.error("Error fetching books by seller:", error);
      return [];
    }
  }

  async getAllLibraryRequests(): Promise<any[]> {
    const requests = await db.select().from(libraryIntegrationRequests);
    return requests;
  }

  // Seller Order Management Implementation
  async getSellerOrders(): Promise<any[]> {
    try {
      // Get all orders with 'paid' status from VyronaSocial module
      const ordersList = await db
        .select()
        .from(orders)
        .where(and(
          eq(orders.status, 'paid'),
          eq(orders.module, 'vyronasocial')
        ))
        .orderBy(desc(orders.createdAt));

      return ordersList;
    } catch (error) {
      console.error("Error in getSellerOrders:", error);
      return [];
    }
  }

  async getOrderDetails(orderId: number): Promise<any> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) return null;

      return {
        ...order,
        deliveryAddress: order.metadata?.deliveryAddress || null,
        customerName: order.metadata?.customerName || 'N/A',
        customerPhone: order.metadata?.customerPhone || 'N/A',
        products: order.metadata?.products || [],
        trackingNumber: order.metadata?.trackingNumber || null
      };
    } catch (error) {
      console.error("Error in getOrderDetails:", error);
      return null;
    }
  }

  async updateOrderStatus(orderId: number, status: string, trackingNumber?: string): Promise<any> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) throw new Error('Order not found');

      const updatedMetadata = {
        ...order.metadata,
        trackingNumber: trackingNumber || order.metadata?.trackingNumber
      };

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: status,
          metadata: updatedMetadata
        })
        .where(eq(orders.id, orderId))
        .returning();

      return updatedOrder;
    } catch (error) {
      console.error("Error in updateOrderStatus:", error);
      throw error;
    }
  }

  // VyronaWallet - Wallet Management Implementation
  async getOrCreateVyronaWallet(userId: number): Promise<any> {
    try {
      // Return a mock wallet for now since the database table structure is not fully set up
      return {
        id: 1,
        userId: userId,
        balance: 1000.00,
        currency: 'INR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error("Error in getOrCreateVyronaWallet:", error);
      throw error;
    }
  }

  async createWalletTransaction(transaction: any): Promise<any> {
    try {
      // Mock transaction for demonstration - in real app this would use database
      const newTransaction = {
        id: Date.now(),
        userId: transaction.userId,
        amount: parseFloat(transaction.amount),
        type: transaction.type || 'credit',
        description: transaction.description || 'Wallet contribution',
        status: 'completed',
        metadata: transaction.metadata || {},
        createdAt: new Date()
      };

      // Mock wallet balance update - in real app this would update database
      console.log(`Added ₹${transaction.amount} to user ${transaction.userId}'s VyronaWallet`);
      
      return newTransaction;
    } catch (error) {
      console.error("Error in createWalletTransaction:", error);
      throw error;
    }
  }

  async updateWalletBalance(userId: number, newBalance: number): Promise<void> {
    // Update the in-memory wallet balance since we're using mock data
    // In a real implementation, this would update the database
    console.log(`Updated wallet balance for user ${userId}: ₹${newBalance}`);
  }

  async getWalletTransactions(userId: number): Promise<any[]> {
    try {
      // Return mock transaction history for demonstration
      return [
        {
          id: 1,
          userId: userId,
          amount: 500.00,
          type: 'credit',
          description: 'Initial wallet setup',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          id: 2,
          userId: userId,
          amount: 500.00,
          type: 'credit',
          description: 'Wallet top-up',
          status: 'completed',
          createdAt: new Date()
        }
      ];
    } catch (error) {
      console.error("Error in getWalletTransactions:", error);
      throw error;
    }
  }

  // Room-specific cart implementations
  async getRoomCartItems(roomId: number): Promise<CartItem[]> {
    try {
      const items = await db
        .select({
          id: cartItems.id,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          userId: cartItems.userId,
          roomId: cartItems.roomId,
          addedAt: cartItems.addedAt,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          description: products.description
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.roomId, roomId));

      return items.map(item => ({
        ...item,
        addedAt: item.addedAt || new Date()
      }));
    } catch (error) {
      console.error("Error fetching room cart items:", error);
      return [];
    }
  }

  async updateCartItemQuantity(cartItemId: number, quantity: number): Promise<CartItem> {
    try {
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, cartItemId))
        .returning();

      const product = await this.getProduct(updatedItem.productId);
      
      return {
        ...updatedItem,
        name: product?.name || '',
        price: product?.price || 0,
        imageUrl: product?.imageUrl || null,
        description: product?.description || null,
        addedAt: updatedItem.addedAt || new Date()
      };
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      throw error;
    }
  }

  // Implement missing interface methods with stub implementations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    await db.update(users).set({ password: newPassword }).where(eq(users.email, email));
  }

  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    const [verification] = await db.insert(otpVerifications).values(otp).returning();
    return verification;
  }

  async getOtpVerification(identifier: string, otp: string, type: string): Promise<OtpVerification | undefined> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.type, type)
        )
      );
    return verification;
  }

  async markOtpAsVerified(id: number): Promise<void> {
    await db.update(otpVerifications).set({ isVerified: true }).where(eq(otpVerifications.id, id));
  }

  async connectInstagramStore(store: InsertInstagramStore): Promise<InstagramStore> {
    const [newStore] = await db.insert(instagramStores).values(store).returning();
    return newStore;
  }

  async getUserInstagramStores(userId: number): Promise<InstagramStore[]> {
    return await db.select().from(instagramStores).where(eq(instagramStores.userId, userId));
  }

  async getInstagramStore(id: number): Promise<InstagramStore | undefined> {
    const [store] = await db.select().from(instagramStores).where(eq(instagramStores.id, id));
    return store;
  }

  async updateInstagramStoreTokens(id: number, accessToken: string, refreshToken: string, expiresAt: Date): Promise<void> {
    await db
      .update(instagramStores)
      .set({ accessToken, refreshToken, tokenExpiresAt: expiresAt })
      .where(eq(instagramStores.id, id));
  }

  async disconnectInstagramStore(id: number): Promise<boolean> {
    const result = await db.delete(instagramStores).where(eq(instagramStores.id, id));
    return result.rowCount > 0;
  }

  async syncInstagramProducts(storeId: number, products: InsertInstagramProduct[]): Promise<InstagramProduct[]> {
    const insertedProducts = await db.insert(instagramProducts).values(products).returning();
    return insertedProducts;
  }

  async getInstagramProducts(storeId: number): Promise<InstagramProduct[]> {
    return await db.select().from(instagramProducts).where(eq(instagramProducts.storeId, storeId));
  }

  async updateInstagramProduct(id: number, updates: Partial<InsertInstagramProduct>): Promise<InstagramProduct | undefined> {
    const [updatedProduct] = await db
      .update(instagramProducts)
      .set(updates)
      .where(eq(instagramProducts.id, id))
      .returning();
    return updatedProduct;
  }

  async createInstagramOrder(order: InsertInstagramOrder): Promise<InstagramOrder> {
    const [newOrder] = await db.insert(instagramOrders).values(order).returning();
    return newOrder;
  }

  async getInstagramOrders(storeId: number): Promise<InstagramOrder[]> {
    return await db.select().from(instagramOrders).where(eq(instagramOrders.storeId, storeId));
  }

  async updateInstagramOrderStatus(id: number, status: string): Promise<InstagramOrder | undefined> {
    const [updatedOrder] = await db
      .update(instagramOrders)
      .set({ status })
      .where(eq(instagramOrders.id, id))
      .returning();
    return updatedOrder;
  }

  async recordInstagramAnalytics(analytics: InsertInstagramAnalytics): Promise<InstagramAnalytics> {
    const [newAnalytics] = await db.insert(instagramAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async getInstagramAnalytics(storeId: number, startDate: Date, endDate: Date): Promise<InstagramAnalytics[]> {
    return await db
      .select()
      .from(instagramAnalytics)
      .where(
        and(
          eq(instagramAnalytics.storeId, storeId),
          sql`${instagramAnalytics.createdAt} >= ${startDate}`,
          sql`${instagramAnalytics.createdAt} <= ${endDate}`
        )
      );
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
