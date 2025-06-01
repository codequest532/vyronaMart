import { 
  users, products, stores, shoppingRooms, cartItems, orders, achievements, gameScores,
  type User, type InsertUser, type Product, type InsertProduct, 
  type Store, type InsertStore, type ShoppingRoom, type InsertShoppingRoom,
  type CartItem, type InsertCartItem, type Order, type InsertOrder,
  type Achievement, type InsertAchievement, type GameScore, type InsertGameScore
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoins(id: number, coins: number): Promise<User | undefined>;
  updateUserXP(id: number, xp: number): Promise<User | undefined>;

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
    // Create a demo user
    const demoUser: User = {
      id: this.currentUserId++,
      username: "arjun_krishnan",
      email: "arjun@example.com",
      password: "hashed_password",
      vyronaCoins: 2450,
      xp: 12340,
      level: 12,
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Seed stores
    const storeData = [
      { name: "Raja Kirana Store", type: "kirana", address: "T. Nagar, Chennai", rating: 480, reviewCount: 120 },
      { name: "Trendy Fashion Hub", type: "fashion", address: "T. Nagar, Chennai", rating: 420, reviewCount: 85 },
      { name: "Express Avenue", type: "mall", address: "Chennai", rating: 450, reviewCount: 2500 },
      { name: "Phoenix MarketCity", type: "mall", address: "Chennai", rating: 470, reviewCount: 3200 },
      { name: "Central Library", type: "library", address: "Anna Nagar, Chennai", rating: 460, reviewCount: 890 },
    ];

    storeData.forEach(store => {
      const newStore: Store = {
        id: this.currentStoreId++,
        ...store,
        latitude: "13.0827",
        longitude: "80.2707",
        isOpen: true,
      };
      this.stores.set(newStore.id, newStore);
    });

    // Seed products
    const productData = [
      { name: "Gaming Smartphone", price: 2599900, category: "electronics", module: "space", storeId: 1, imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9" },
      { name: "Trendy Jacket", price: 289900, category: "fashion", module: "space", storeId: 2, imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105" },
      { name: "The Silent Patient", price: 29900, category: "mystery", module: "read", storeId: 5, imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f", metadata: { author: "Alex Michaelides", rentalPrice: 5000 } },
      { name: "Gaming Headphones", price: 499900, category: "electronics", module: "mall", storeId: 3, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e" },
      { name: "Dune Chronicles", price: 49900, category: "sci-fi", module: "read", storeId: 5, imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d", metadata: { author: "Frank Herbert", rentalPrice: 7500 } },
    ];

    productData.forEach(product => {
      const newProduct: Product = {
        id: this.currentProductId++,
        description: `High quality ${product.name}`,
        ...product,
      };
      this.products.set(newProduct.id, newProduct);
    });

    // Seed shopping rooms
    const roomData = [
      { name: "Fashion Friday Squad", creatorId: 1, currentGame: "ludo", totalCart: 1245000, memberCount: 4 },
      { name: "Tech Hunters", creatorId: 1, currentGame: "trivia", totalCart: 4590000, memberCount: 2 },
    ];

    roomData.forEach(room => {
      const newRoom: ShoppingRoom = {
        id: this.currentRoomId++,
        isActive: true,
        createdAt: new Date(),
        ...room,
      };
      this.shoppingRooms.set(newRoom.id, newRoom);
    });

    // Seed achievements
    const achievementData = [
      { userId: 1, type: "first_purchase" },
      { userId: 1, type: "social_shopper" },
      { userId: 1, type: "game_master" },
      { userId: 1, type: "book_lover" },
      { userId: 1, type: "local_explorer" },
    ];

    achievementData.forEach(achievement => {
      const newAchievement: Achievement = {
        id: this.currentAchievementId++,
        earnedAt: new Date(),
        ...achievement,
      };
      this.achievements.set(newAchievement.id, newAchievement);
    });
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

export const storage = new MemStorage();
