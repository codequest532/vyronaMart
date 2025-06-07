import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupRoomRoutes } from "./simple-rooms";
import { setupVyronaSocialAPI } from "./vyronasocial-api";
import { db } from "./db";
import { 
  insertUserSchema, insertProductSchema, insertCartItemSchema, insertGameScoreSchema,
  insertShoppingGroupSchema, insertGroupMemberSchema, insertGroupWishlistSchema,
  insertGroupMessageSchema, insertProductShareSchema, insertGroupCartSchema,
  insertGroupCartContributionSchema, insertVyronaWalletSchema, insertWalletTransactionSchema,
  insertGroupOrderSchema, insertGroupOrderContributionSchema, insertOrderSchema
} from "@shared/schema";
import { shoppingGroups, groupMembers } from "../migrations/schema";
import { z } from "zod";
import { sendOTPEmail } from "./email";
import { eq, desc, sql } from "drizzle-orm";

// Online status and WebSocket management
interface OnlineUser {
  userId: number;
  username: string;
  groupId: number | null;
  ws: WebSocket;
  lastSeen: Date;
}

const onlineUsers = new Map<string, OnlineUser>();
const groupCallStates = new Map<number, {
  callId: string;
  initiator: number;
  participants: number[];
  startedAt: Date;
}>();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/'];
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    cb(null, isAllowed);
  }
});

// Admin credentials (fixed)
const ADMIN_CREDENTIALS = {
  email: 'mgmags25@gmail.com',
  password: '12345678',
  id: 1,
  username: 'admin',
  role: 'admin' as const
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check admin credentials first
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        req.session.user = {
          id: ADMIN_CREDENTIALS.id,
          email: ADMIN_CREDENTIALS.email,
          username: ADMIN_CREDENTIALS.username,
          role: ADMIN_CREDENTIALS.role
        };
        
        return res.json({
          success: true,
          user: req.session.user,
          message: "Admin login successful"
        });
      }
      
      // Check database for customer/seller users with retry logic
      let user;
      try {
        user = await storage.getUserByEmail(email);
        if (user && user.password !== password) {
          user = undefined; // Password mismatch
        }
      } catch (dbError) {
        console.error("Database connection error during login:", dbError);
        // Fallback: retry once after a brief delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          user = await storage.getUserByEmail(email);
          if (user && user.password !== password) {
            user = undefined; // Password mismatch
          }
        } catch (retryError) {
          console.error("Database retry failed:", retryError);
          throw retryError;
        }
      }
      
      if (user) {
        req.session.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role as 'customer' | 'seller' | 'admin'
        };
        
        res.json({
          success: true,
          user: req.session.user,
          message: "Login successful"
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed"
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Logout failed" });
      }
      res.json({ success: true, message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.session?.user) {
      res.json({
        success: true,
        user: req.session.user
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
  });

  // VyronaRead API endpoints for authentic book data
  app.get("/api/vyronaread/ebooks", async (req, res) => {
    try {
      const ebooks = await storage.getAllEBooks();
      res.json(ebooks);
    } catch (error) {
      console.error("Error fetching e-books:", error);
      res.status(500).json({ message: "Failed to fetch e-books" });
    }
  });

  app.get("/api/vyronaread/seller-books", async (req, res) => {
    try {
      const sellerId = req.query.sellerId;
      if (sellerId) {
        const sellerBooks = await storage.getPhysicalBooksBySeller(parseInt(sellerId as string));
        res.json(sellerBooks);
      } else {
        const physicalBooks = await storage.getAllPhysicalBooks();
        res.json(physicalBooks);
      }
    } catch (error) {
      console.error("Error fetching seller books:", error);
      res.status(500).json({ message: "Failed to fetch seller books" });
    }
  });

  app.get("/api/vyronaread/library-books", async (req, res) => {
    try {
      const libraryBooks = await storage.getAllPhysicalBooks();
      res.json(libraryBooks);
    } catch (error) {
      console.error("Error fetching library books:", error);
      res.status(500).json({ message: "Failed to fetch library books" });
    }
  });

  // Delete book route
  app.delete("/api/vyronaread/books/:bookId", async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }
      
      const success = await storage.deletePhysicalBook(bookId);
      if (success) {
        res.json({ message: "Book deleted successfully" });
      } else {
        res.status(404).json({ message: "Book not found" });
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  app.get("/api/vyronaread/library-books/:libraryId", async (req, res) => {
    try {
      const libraryId = parseInt(req.params.libraryId);
      const libraryBooks = await storage.getPhysicalBooksByLibrary(libraryId);
      res.json(libraryBooks);
    } catch (error) {
      console.error("Error fetching library books:", error);
      res.status(500).json({ message: "Failed to fetch library books" });
    }
  });

  app.get("/api/vyronaread/libraries", async (req, res) => {
    try {
      const libraries = await storage.getAllLibraryRequests();
      // Filter only approved libraries
      const approvedLibraries = libraries.filter((lib: any) => lib.status === 'approved');
      res.json(approvedLibraries);
    } catch (error) {
      console.error("Error fetching libraries:", error);
      res.status(500).json({ message: "Failed to fetch libraries" });
    }
  });

  // Debug endpoint to check existing users
  app.get("/api/debug/users", async (req, res) => {
    try {
      // Get all users for debugging (remove passwords for security)
      const allUsers = Array.from((storage as any).users.values()).map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }));
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Debug failed" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      

      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user information in session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      };
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      (req as any).session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, mobile, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Determine user role - only mgmags25@gmail.com can be admin
      let userRole = role || "customer";
      if (email === "mgmags25@gmail.com") {
        userRole = "admin";
      } else if (userRole === "admin") {
        // Prevent anyone else from registering as admin
        userRole = "customer";
      }
      
      // Create new user with bonus coins
      const newUser = await storage.createUser({
        username,
        email,
        mobile: mobile || null,
        password,
        role: userRole,
        vyronaCoins: 500, // Welcome bonus
        xp: 0,
        level: 1
      });
      
      // Store user information in session
      (req as any).session.user = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      };
      
      res.json({ user: { ...newUser, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Forgot password - send OTP
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      await storage.createOtpVerification({
        identifier: email,
        otp,
        type: "password_reset",
        expiresAt,
        verified: false
      });

      // Send OTP via email using Brevo
      const emailSent = await sendOTPEmail(email, otp);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send OTP email" });
      }

      res.json({ 
        message: "OTP sent successfully to your email",
        expiresAt: expiresAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      const verification = await storage.getOtpVerification(email, otp, "password_reset");
      
      if (!verification || verification.verified) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      if (new Date() > verification.expiresAt) {
        return res.status(400).json({ message: "OTP has expired" });
      }

      // Mark OTP as verified
      await storage.markOtpAsVerified(verification.id);

      res.json({ message: "OTP verified successfully" });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Reset password after OTP verification
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, password, confirmPassword } = req.body;
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Update user password
      await storage.updateUserPassword(email, password);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Current user endpoint for authentication
  app.get("/api/current-user", async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      
      if (!sessionUser) {
        return res.json(null);
      }
      
      // Get full user data from storage
      const user = await storage.getUser(sessionUser.id);
      
      if (!user) {
        return res.json(null);
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/:id/coins", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount } = z.object({ amount: z.number() }).parse(req.body);
      
      const user = await storage.updateUserCoins(id, amount);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/:id/xp", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount } = z.object({ amount: z.number() }).parse(req.body);
      
      const user = await storage.updateUserXP(id, amount);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes - VyronaHub (individual buy enabled products)
  app.get("/api/products", async (req, res) => {
    try {
      const { module, category } = req.query;
      const products = await storage.getProducts(
        module as string,
        category as string
      );
      // Filter products that have individual buy enabled (including those with both enabled)
      const individualBuyProducts = products.filter(product => 
        product.enableIndividualBuy !== false
      );
      res.json(individualBuyProducts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Products for VyronaSocial (group buy only)
  app.get("/api/social/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      // Filter products based on enableGroupBuy flag for VyronaSocial
      const groupBuyProducts = products.filter(product => 
        product.enableGroupBuy === true
      );
      res.json(groupBuyProducts);
    } catch (error) {
      console.error("Error fetching social products:", error);
      res.status(500).json({ error: "Failed to fetch social products" });
    }
  });

  // Update product listing preferences
  app.patch("/api/products/:id/listing", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { enableIndividualBuy, enableGroupBuy, groupBuyMinQuantity, groupBuyDiscount } = req.body;
      
      const updatedProduct = await storage.updateProductListing(productId, {
        enableIndividualBuy,
        enableGroupBuy,
        groupBuyMinQuantity,
        groupBuyDiscount
      });
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product listing:", error);
      res.status(500).json({ error: "Failed to update product listing" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // VyronaRead - Add book through seller dashboard
  app.post("/api/vyronaread/books", async (req, res) => {
    try {
      const { title, author, isbn, genre, price, category, format, fileUrl } = req.body;
      
      const bookProduct = {
        name: title,
        description: `${author} - ${genre}`,
        price: price || Math.floor(Math.random() * 100000) + 29900,
        category: category || (format === "ebook" ? "ebooks" : "books"),
        module: "vyronaread",
        metadata: {
          author,
          isbn,
          genre,
          format: format || "physical",
          fileUrl: fileUrl || null
        }
      };
      
      const product = await storage.createProduct(bookProduct);
      res.json(product);
    } catch (error) {
      console.error("Error adding VyronaRead book:", error);
      res.status(500).json({ message: "Failed to add book" });
    }
  });

  // Store routes
  app.get("/api/stores", async (req, res) => {
    try {
      const { type } = req.query;
      const stores = await storage.getStores(type as string);
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const store = await storage.getStore(id);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Shopping room routes (maps to VyronaSocial rooms for checkout)
  app.get("/api/shopping-rooms", async (req, res) => {
    try {
      console.log("=== SHOPPING ROOMS ENDPOINT HIT (FIRST ONE) ===");
      
      // Get current user ID from session
      const session = (req as any).session;
      const userId = session?.user?.id || 4;
      
      console.log("Shopping rooms endpoint - Session:", session);
      console.log("Shopping rooms endpoint - User ID:", userId);
      
      // Use the VyronaSocial shopping groups data
      const rooms = await storage.getShoppingGroups(userId);
      console.log("Shopping rooms from storage:", rooms);
      
      // Transform to match expected format for checkout
      const transformedRooms = rooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description || '',
        creatorId: room.creatorId,
        isActive: room.isActive,
        maxMembers: room.maxMembers || 10,
        memberCount: room.memberCount || 0,
        totalCart: room.totalCart || 0,
        roomCode: room.roomCode,
        createdAt: room.createdAt
      }));
      
      console.log("Transformed rooms for checkout:", transformedRooms);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(transformedRooms);
    } catch (error) {
      console.error("Shopping rooms error:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  app.post("/api/shopping-rooms", async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Room name is required" });
      }

      // Get current user ID from session
      const session = (req as any).session;
      const userId = session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const groupData = {
        name: name.trim(),
        description: description || '',
        creatorId: userId,
        maxMembers: 10
      };

      const newGroup = await storage.createShoppingGroup(groupData);
      res.json(newGroup);
    } catch (error) {
      console.error("Create shopping group error:", error);
      res.status(500).json({ message: "Failed to create shopping group", error: error.message });
    }
  });

  app.get("/api/shopping-rooms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getShoppingRoom(id);
      if (!room) {
        return res.status(404).json({ message: "Shopping room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/shopping-rooms/join", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || !code.trim()) {
        return res.status(400).json({ message: "Room code is required" });
      }

      // Get current user ID from session
      const session = (req as any).session;
      const userId = session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Find group by room code - get all groups and filter
      const allGroups = await storage.getShoppingGroups(0); // Get all groups regardless of user
      const targetGroup = allGroups.find((g: any) => g.roomCode === code.trim());
      
      if (!targetGroup) {
        return res.status(404).json({ message: "Invalid room code" });
      }

      // Check if user is already a member
      const existingMembership = await storage.getGroupMembers(targetGroup.id);
      const isAlreadyMember = existingMembership.some((member: any) => member.userId === userId);
      
      if (isAlreadyMember) {
        return res.status(400).json({ message: "You are already a member of this group" });
      }

      // Add user as member
      await storage.addGroupMember({
        groupId: targetGroup.id,
        userId: userId,
        role: "member"
      });
      
      res.json({ message: "Joined group successfully", group: targetGroup });
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  // Cart routes
  app.get("/api/cart/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { roomId } = req.query;
      const cartItems = await storage.getCartItems(
        userId,
        roomId ? parseInt(roomId as string) : undefined
      );
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const cartItem = insertCartItemSchema.parse(req.body);
      const newItem = await storage.addCartItem(cartItem);
      res.json(newItem);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeCartItem(id);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Order routes
  app.get("/api/orders/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Game routes
  app.post("/api/games/score", async (req, res) => {
    try {
      const gameScore = insertGameScoreSchema.parse(req.body);
      const newScore = await storage.addGameScore(gameScore);
      
      // Award coins to user
      await storage.updateUserCoins(gameScore.userId, gameScore.coinsEarned);
      
      res.json(newScore);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/games/scores/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const scores = await storage.getUserGameScores(userId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Achievements endpoint
  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievements = await storage.getUserAchievements ? await storage.getUserAchievements(userId) : [];
      res.json(achievements);
    } catch (error) {
      console.error("Achievements error:", error);
      res.json([]);
    }
  });

  // VyronaSocial - Shopping Groups routes
  app.post("/api/social/groups", async (req, res) => {
    try {
      const groupData = insertShoppingGroupSchema.parse(req.body);
      const group = await storage.createShoppingGroup(groupData);
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/social/groups/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const groups = await storage.getShoppingGroups(userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/social/group/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.getShoppingGroup(id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/social/groups/:id/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const memberData = insertGroupMemberSchema.parse({ ...req.body, groupId });
      const member = await storage.addGroupMember(memberData);
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/social/groups/:id/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const members = await storage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // VyronaSocial - Group Wishlists routes
  app.post("/api/social/groups/:id/wishlist", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const wishlistData = insertGroupWishlistSchema.parse({ ...req.body, groupId });
      const wishlist = await storage.addToGroupWishlist(wishlistData);
      res.json(wishlist);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/social/groups/:id/wishlist", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const wishlist = await storage.getGroupWishlist(groupId);
      res.json(wishlist);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // VyronaSocial - Group Messages routes
  app.post("/api/social/groups/:id/messages", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const messageData = insertGroupMessageSchema.parse({ ...req.body, groupId });
      const message = await storage.addGroupMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/social/groups/:id/messages", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const messages = await storage.getGroupMessages(groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // VyronaSocial - Product Shares routes
  app.post("/api/social/shares", async (req, res) => {
    try {
      const shareData = insertProductShareSchema.parse(req.body);
      const share = await storage.shareProduct(shareData);
      res.json(share);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/social/shares/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const shares = await storage.getProductShares(userId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Group Cart Workflow API Routes
  app.post("/api/group-carts", async (req, res) => {
    try {
      console.log("Creating group cart with data:", req.body);
      const groupCartData = insertGroupCartSchema.parse(req.body);
      console.log("Parsed group cart data:", groupCartData);
      const groupCart = await storage.createGroupCart(groupCartData);
      console.log("Created group cart:", groupCart);
      res.json(groupCart);
    } catch (error) {
      console.error("Group cart creation error:", error);
      res.status(500).json({ message: "Failed to create group cart", error: error.message });
    }
  });

  app.get("/api/group-carts/product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const groupCarts = await storage.getActiveGroupCartsByProduct(productId);
      res.json(groupCarts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group carts" });
    }
  });

  app.post("/api/group-carts/:id/join", async (req, res) => {
    try {
      const groupCartId = parseInt(req.params.id);
      const contributionData = insertGroupCartContributionSchema.parse({ 
        ...req.body, 
        groupCartId 
      });
      const contribution = await storage.joinGroupCart(contributionData);
      res.json(contribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to join group cart" });
    }
  });

  app.get("/api/group-carts/:id/contributions", async (req, res) => {
    try {
      const groupCartId = parseInt(req.params.id);
      const contributions = await storage.getGroupCartContributions(groupCartId);
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.post("/api/group-carts/:id/checkout", async (req, res) => {
    try {
      const groupCartId = parseInt(req.params.id);
      const orderData = { 
        userId: (req as any).user?.id || 1,
        totalAmount: req.body.totalAmount || 0,
        module: 'social',
        status: 'pending',
        metadata: { groupCartId, ...req.body }
      };
      const groupOrder = await storage.createOrder(orderData);
      res.json(groupOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to create group order" });
    }
  });

  // VyronaWallet API Routes
  app.get("/api/wallet/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const wallet = await storage.getOrCreateVyronaWallet(userId);
      res.json(wallet);
    } catch (error) {
      console.error("Wallet fetch error:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.post("/api/wallet/contribute", async (req, res) => {
    try {
      const { roomId, amount, userId, paymentMethod } = req.body;
      
      if (!roomId || !amount || !userId || !paymentMethod) {
        return res.status(400).json({ message: "Room ID, amount, user ID, and payment method are required" });
      }

      if (amount <= 0) {
        return res.status(400).json({ message: "Contribution amount must be positive" });
      }

      // Get user's wallet
      const wallet = await storage.getOrCreateVyronaWallet(userId);
      
      // Add the contribution amount to wallet balance (since this is payment TO wallet)
      const newBalance = wallet.balance + amount;
      await storage.updateWalletBalance(userId, newBalance);

      // Create transaction record for wallet credit
      const transactionData = {
        userId: userId,
        type: "wallet_topup",
        amount: amount, // Positive amount for credit
        description: `Wallet top-up via ${paymentMethod} for room ${roomId}`,
        metadata: { roomId: roomId, paymentMethod: paymentMethod, source: "group_contribution" }
      };
      
      const transaction = await storage.createWalletTransaction(transactionData);

      res.json({
        success: true,
        transaction,
        newBalance,
        message: `Successfully added ₹${amount} to VyronaWallet via ${paymentMethod}`
      });
    } catch (error) {
      console.error("Wallet contribution error:", error);
      res.status(500).json({ message: "Failed to process contribution" });
    }
  });

  app.post("/api/wallet/:userId/transactions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactionData = {
        ...req.body,
        userId: userId
      };
      console.log("Creating wallet transaction:", transactionData);
      const transaction = await storage.createWalletTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Transaction creation error:", error);
      res.status(500).json({ message: "Failed to create transaction", error: error.message });
    }
  });

  app.get("/api/wallet/:userId/transactions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await storage.getWalletTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Shopping Room Cart Items endpoint
  app.get("/api/shopping-rooms/:roomId/cart", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const cartItems = await storage.getShoppingRoomCartItems(roomId);
      res.json(cartItems);
    } catch (error) {
      console.error("Cart items fetch error:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  // Add item to shopping room cart
  app.post("/api/shopping-rooms/:roomId/add-cart-item", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { productId, quantity } = req.body;
      const userId = req.session?.user?.id;

      console.log("=== ADDING ITEM TO SHOPPING ROOM CART ===");
      console.log("Room ID:", roomId);
      console.log("Product ID:", productId);
      console.log("Quantity:", quantity);
      console.log("User ID:", userId);
      console.log("Session:", req.session?.user);

      if (!userId) {
        console.log("Authentication required - no user ID");
        return res.status(401).json({ message: "Authentication required" });
      }

      const cartItemData = {
        userId: userId,
        productId: productId,
        quantity: quantity || 1,
        roomId: roomId,
        addedAt: new Date()
      };

      console.log("Cart item data:", cartItemData);
      const cartItem = await storage.addCartItem(cartItemData);
      console.log("Cart item added successfully:", cartItem);
      
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding item to shopping room cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // Room Cart API Endpoints
  app.post("/api/room-cart/add", async (req, res) => {
    try {
      const { roomId, productId, quantity } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const cartItemData = {
        userId: userId,
        productId: productId,
        quantity: quantity || 1,
        roomId: roomId,
        addedAt: new Date()
      };
      
      const cartItem = await storage.addCartItem(cartItemData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding item to room cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.get("/api/room-cart/:roomId", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const cartItems = await storage.getRoomCartItems(roomId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching room cart:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/room-cart/update", async (req, res) => {
    try {
      const { cartItemId, quantity } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const updatedItem = await storage.updateCartItemQuantity(cartItemId, quantity);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      res.status(500).json({ message: "Failed to update quantity" });
    }
  });

  app.post("/api/room-cart/remove", async (req, res) => {
    try {
      const { cartItemId } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      await storage.removeCartItem(cartItemId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: "Failed to remove item" });
    }
  });

  // VyronaWallet Checkout API
  app.post("/api/wallet/checkout", async (req, res) => {
    try {
      const { 
        userId, roomId, items, totalAmount, paymentMethod, 
        isGroupPayment, memberCount, contributionPerMember, 
        deliveryAddresses, useSingleDelivery 
      } = req.body;
      
      // DEVELOPMENT MODE: Mock wallet interactions for testing
      const requiredAmount = isGroupPayment ? contributionPerMember : totalAmount;
      
      // Mock wallet data for development
      const mockWallet = {
        id: 1,
        userId: userId,
        balance: 5000.00, // Always sufficient for testing
        currency: "INR"
      };
      
      // Mock transaction for development
      const mockTransaction = {
        id: Date.now(),
        userId: userId,
        amount: -requiredAmount,
        type: "payment",
        description: isGroupPayment 
          ? `Group contribution for room ${roomId} (₹${requiredAmount.toFixed(2)} of ₹${totalAmount.toFixed(2)})`
          : `Purchase from room ${roomId}`,
        metadata: {
          roomId,
          items,
          paymentMethod,
          isGroupPayment,
          memberCount,
          contributionPerMember,
          totalAmount,
          deliveryAddresses,
          useSingleDelivery
        },
        createdAt: new Date()
      };

      // Mock customer information for development
      const customer = {
        id: userId,
        username: "TestUser",
        email: "test@example.com",
        mobile: "+91-9876543210",
        vyronaCoins: 100,
        xp: 250,
        level: 2
      };
      
      // Create order record with complete customer and product details for seller
      const order = await storage.createOrder({
        userId: userId,
        totalAmount: isGroupPayment ? contributionPerMember : totalAmount,
        status: isGroupPayment ? "pending_contributions" : "paid",
        module: "vyronasocial",
        metadata: {
          roomId,
          items,
          transactionId: transaction.id,
          paymentMethod: "vyronawallet",
          isGroupPayment,
          memberCount,
          totalOrderAmount: totalAmount,
          deliveryAddresses,
          useSingleDelivery,
          // Customer details for seller fulfillment
          customerName: customer?.username || 'Customer',
          customerEmail: customer?.email || 'N/A',
          customerPhone: customer?.mobile || 'N/A',
          // Product details for dispatch
          products: items.map(item => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.price * item.quantity
          })),
          // Order fulfillment status
          fulfillmentStatus: 'processing',
          orderDate: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        message: isGroupPayment 
          ? "Your contribution has been processed. Waiting for other members to contribute."
          : "Payment successful",
        orderId: order.id,
        transactionId: transaction.id,
        remainingBalance: updatedWallet.balance,
        isGroupPayment,
        contributionAmount: requiredAmount
      });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Payment processing failed",
        error: error.message 
      });
    }
  });

  // VyronaSocial - Notifications routes
  app.get("/api/social/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/social/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // VyronaRead Books - Library Integration Requests
  app.post("/api/library-integration-requests", async (req, res) => {
    try {
      const requestData = {
        sellerId: 3, // Default seller ID for now
        libraryName: req.body.libraryName || req.body.name,
        libraryType: req.body.libraryType || req.body.type,
        address: req.body.address,
        contactPerson: req.body.contactPerson || req.body.contact,
        phone: req.body.phone || null,
        email: req.body.email || null,
        description: req.body.description || null,
        booksListCsv: req.body.booksListCsv || null,
      };

      // Create the request in the database
      const newRequest = await storage.createLibraryIntegrationRequest(requestData);
      res.json(newRequest);
    } catch (error) {
      console.error("Error creating library integration request:", error);
      res.status(500).json({ message: "Failed to create library integration request" });
    }
  });

  // VyronaRead Books - Book Loan Management
  app.post("/api/book-loans", async (req, res) => {
    try {
      const { bookId, libraryId, borrowerId, dueDate } = req.body;
      
      const loan = await storage.createBookLoan({
        bookId,
        libraryId,
        borrowerId,
        borrowedAt: new Date(),
        dueDate: new Date(dueDate),
        status: 'active'
      });
      
      res.json(loan);
    } catch (error) {
      console.error("Error creating book loan:", error);
      res.status(500).json({ message: "Failed to borrow book" });
    }
  });

  app.get("/api/book-loans/:borrowerId", async (req, res) => {
    try {
      const borrowerId = parseInt(req.params.borrowerId);
      const loans = await storage.getBookLoans(undefined, borrowerId);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching book loans:", error);
      res.status(500).json({ message: "Failed to fetch book loans" });
    }
  });

  app.patch("/api/book-loans/:loanId/return", async (req, res) => {
    try {
      const loanId = parseInt(req.params.loanId);
      const loan = await storage.returnBook(loanId);
      res.json(loan);
    } catch (error) {
      console.error("Error returning book:", error);
      res.status(500).json({ message: "Failed to return book" });
    }
  });

  // Create Library Integration Request with CSV Upload
  app.post("/api/library-integration-requests", async (req, res) => {
    try {
      const { 
        name, type, address, contact, phone, email, description, booksListCsv 
      } = req.body;

      const libraryRequest = {
        sellerId: 1, // Default seller ID for now
        libraryName: name,
        libraryType: type,
        address,
        contactPerson: contact,
        phone: phone || null,
        email: email || null,
        description: description || null,
        booksListCsv: booksListCsv || null, // Store parsed CSV data
        status: "pending"
      };

      const newRequest = await storage.createLibraryIntegrationRequest(libraryRequest);
      res.json(newRequest);
    } catch (error) {
      console.error("Error creating library request:", error);
      res.status(500).json({ message: "Failed to create library request" });
    }
  });

  // Admin - Get Library Integration Requests
  app.get("/api/admin/library-requests", async (req, res) => {
    try {
      const requests = await storage.getLibraryIntegrationRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching library requests:", error);
      res.status(500).json({ message: "Failed to fetch library requests" });
    }
  });

  // Admin - Update Library Integration Request Status
  app.patch("/api/admin/library-requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const processedBy = 2; // Default admin ID

      const updatedRequest = await storage.updateLibraryIntegrationRequestStatus(
        parseInt(id),
        status,
        processedBy,
        adminNotes
      );

      if (!updatedRequest) {
        return res.status(404).json({ message: "Library request not found" });
      }

      // If approved, create books for the library from CSV data
      if (status === 'approved') {
        // Get the full library request data including CSV
        const fullLibraryData = await storage.getLibraryIntegrationRequestById(parseInt(id));
        await storage.createLibraryBooks(parseInt(id), fullLibraryData);
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating library request:", error);
      res.status(500).json({ message: "Failed to update library request" });
    }
  });

  // Admin - Delete Library Integration Request
  app.delete("/api/admin/library-requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const libraryId = parseInt(id);

      // Delete associated physical books first
      await storage.deleteLibraryBooks(libraryId);

      // Delete the library integration request
      const deleted = await storage.deleteLibraryIntegrationRequest(libraryId);

      if (!deleted) {
        return res.status(404).json({ message: "Library request not found" });
      }

      res.json({ message: "Library integration removed successfully" });
    } catch (error) {
      console.error("Error deleting library request:", error);
      res.status(500).json({ message: "Failed to delete library request" });
    }
  });

  // Shopping rooms for checkout selection (maps to VyronaSocial rooms)
  app.get("/api/shopping-rooms", async (req, res) => {
    console.log("=== SHOPPING ROOMS ENDPOINT HIT ===");
    
    try {
      // Get current user ID from session (fallback to user 4 for demo)
      const session = (req as any).session;
      const userId = session?.user?.id || 4;
      
      console.log("Shopping rooms endpoint - Session:", session);
      console.log("Shopping rooms endpoint - User ID:", userId);
      
      // Use the existing VyronaSocial storage method that we know works
      const rooms = await storage.getShoppingGroups(userId);
      console.log("Shopping rooms from storage:", rooms);
      
      // Transform to match expected format
      const transformedRooms = rooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description || '',
        creatorId: room.creatorId,
        isActive: room.isActive,
        maxMembers: room.maxMembers || 10,
        totalCart: room.totalCart || 0,
        roomCode: room.roomCode,
        createdAt: room.createdAt
      }));
      
      console.log("Transformed rooms:", transformedRooms);
      res.json(transformedRooms);
    } catch (error) {
      console.error("=== SHOPPING ROOMS ERROR ===");
      console.error("Error fetching shopping rooms:", error);
      console.error("Error stack:", error.stack);
      console.error("=== SHOPPING ROOMS ERROR END ===");
      res.status(500).json({ message: "Failed to fetch shopping rooms" });
    }
  });

  // Group messaging endpoints
  app.post("/api/group-messages", async (req, res) => {
    try {
      const { content, groupId, messageType = 'text' } = req.body;
      const session = (req as any).session;
      const userId = session?.user?.id;
      const username = session?.user?.username || 'User';

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!content || !groupId) {
        return res.status(400).json({ message: "Content and groupId are required" });
      }

      // Save message to database
      const savedMessage = await storage.addGroupMessage({
        userId,
        groupId: parseInt(groupId),
        content,
        messageType
      });

      // Create response message with username
      const messageData = {
        id: savedMessage.id,
        content: savedMessage.content,
        userId: savedMessage.userId,
        username,
        groupId: savedMessage.groupId,
        messageType: savedMessage.messageType,
        sentAt: savedMessage.sentAt
      };

      console.log("Creating message:", messageData);

      // Broadcast message to all group members via WebSocket
      const groupMembers = await storage.getGroupMembers(parseInt(groupId));
      
      groupMembers.forEach(member => {
        const userKey = `${member.userId}-${groupId}`;
        const onlineUser = onlineUsers.get(userKey);
        
        if (onlineUser && onlineUser.ws.readyState === WebSocket.OPEN) {
          onlineUser.ws.send(JSON.stringify({
            type: 'new-message',
            message: messageData,
            timestamp: new Date().toISOString()
          }));
        }
      });

      res.json(messageData);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // File upload endpoint for group messages
  app.post("/api/group-messages/upload", upload.single('file'), async (req, res) => {
    try {
      const { groupId, messageType = 'file' } = req.body;
      const session = (req as any).session;
      const userId = session?.user?.id;
      const username = session?.user?.username || 'User';

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!req.file || !groupId) {
        return res.status(400).json({ message: "File and groupId are required" });
      }

      // Create file message content with metadata
      const fileData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: req.file.path,
        storedFileName: req.file.filename, // Add the actual stored filename
        mimeType: req.file.mimetype
      };

      // Save file message to database
      const savedMessage = await storage.addGroupMessage({
        userId,
        groupId: parseInt(groupId),
        content: `📎 ${req.file.originalname}`, // Display name for file
        messageType,
        metadata: fileData
      });

      // Create response message with username
      const messageData = {
        id: savedMessage.id,
        content: savedMessage.content,
        userId: savedMessage.userId,
        username,
        groupId: savedMessage.groupId,
        messageType: savedMessage.messageType,
        metadata: fileData,
        sentAt: savedMessage.sentAt
      };

      console.log("Creating file message:", messageData);

      // Broadcast message to all group members via WebSocket
      const groupMembers = await storage.getGroupMembers(parseInt(groupId));
      
      groupMembers.forEach(member => {
        const userKey = `${member.userId}-${groupId}`;
        const onlineUser = onlineUsers.get(userKey);
        
        if (onlineUser && onlineUser.ws.readyState === WebSocket.OPEN) {
          onlineUser.ws.send(JSON.stringify({
            type: 'new-message',
            message: messageData,
            timestamp: new Date().toISOString()
          }));
        }
      });

      res.json(messageData);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/group-messages/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;
      const session = (req as any).session;
      const userId = session?.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // For demo purposes, return sample messages
      const sampleMessages = [
        {
          id: 1,
          content: `Welcome to the group! Start chatting and shopping together.`,
          userId: 0,
          username: 'System',
          groupId: parseInt(groupId),
          messageType: 'system',
          sentAt: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: 2,
          content: 'Hey everyone! Ready to find some great deals together?',
          userId: userId,
          username: session?.user?.username || 'You',
          groupId: parseInt(groupId),
          messageType: 'text',
          sentAt: new Date(Date.now() - 300000).toISOString()
        }
      ];

      res.json(sampleMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // VyronaRead Books - Get books for customers
  app.get("/api/books", async (req, res) => {
    try {
      const { type, category } = req.query;
      
      // Get books from products where module is "read"
      const allProducts = await storage.getProducts("read", category as string);
      let books = allProducts;

      if (type === 'physical') {
        books = allProducts.filter(book => (book.metadata as any)?.type === 'physical');
      } else if (type === 'digital') {
        books = allProducts.filter(book => (book.metadata as any)?.type === 'digital');
      }

      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // VyronaRead Books - Purchase/Rent book
  app.post("/api/books/:id/purchase", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, action } = req.body; // action: 'buy' or 'rent'
      
      const book = await storage.getProduct(parseInt(id));
      if (!book || book.module !== 'read') {
        return res.status(404).json({ message: "Book not found" });
      }

      const order = await storage.createOrder({
        userId,
        module: 'read',
        totalAmount: book.price,
        status: 'completed',
        metadata: {
          productId: book.id,
          action,
          bookTitle: book.name
        }
      });

      res.json(order);
    } catch (error) {
      console.error("Error processing book purchase:", error);
      res.status(500).json({ message: "Failed to process book purchase" });
    }
  });

  // Seller Order Management System
  app.get("/api/seller/orders", async (req, res) => {
    try {
      // Get all orders for sellers to manage
      const orders = await storage.getSellerOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ message: "Failed to fetch seller orders" });
    }
  });

  app.get("/api/seller/orders/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const orderDetails = await storage.getOrderDetails(orderId);
      
      if (!orderDetails) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(orderDetails);
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  app.patch("/api/seller/orders/:orderId/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { status, trackingNumber } = req.body;
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status, trackingNumber);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // VyronaRead Data Organization - Authentic seller-uploaded content
  
  // E-books uploaded by sellers for VyronaRead E-Reader section (public access to all approved books)
  app.get("/api/vyronaread/ebooks", async (req, res) => {
    try {
      const ebooks = await storage.getProducts("vyronaread", "ebooks");
      res.json(ebooks);
    } catch (error) {
      console.error("Error fetching e-books:", error);
      res.status(500).json({ message: "Failed to fetch e-books" });
    }
  });

  // Physical/digital books uploaded by sellers for Browse Books section (public access to all approved books)
  app.get("/api/vyronaread/seller-books", async (req, res) => {
    try {
      // Get all books with "books" category for customer browsing
      const allBooks = await storage.getProducts("vyronaread", "books");
      res.json(allBooks);
    } catch (error) {
      console.error("Error fetching seller books:", error);
      res.status(500).json({ message: "Failed to fetch seller books" });
    }
  });

  // Library books from specific approved library for Library Integration section
  app.get("/api/vyronaread/library-books/:libraryId", async (req, res) => {
    try {
      const libraryId = parseInt(req.params.libraryId);
      const libraryBooks = await storage.getPhysicalBooks(libraryId);
      res.json(libraryBooks);
    } catch (error) {
      console.error("Error fetching library books:", error);
      res.status(500).json({ message: "Failed to fetch library books" });
    }
  });

  // Get all library books (fallback for general browsing)
  app.get("/api/vyronaread/library-books", async (req, res) => {
    try {
      // Get all physical books from all approved libraries
      const allPhysicalBooks = await storage.getPhysicalBooks();
      res.json(allPhysicalBooks);
    } catch (error) {
      console.error("Error fetching library books:", error);
      res.status(500).json({ message: "Failed to fetch library books" });
    }
  });

  // Get available libraries for "Visit Library" functionality
  app.get("/api/vyronaread/libraries", async (req, res) => {
    try {
      const approvedRequests = await storage.getLibraryIntegrationRequests();
      const libraries = approvedRequests.filter((req: any) => req.status === 'approved');
      res.json(libraries);
    } catch (error) {
      console.error("Error fetching libraries:", error);
      res.status(500).json({ message: "Failed to fetch libraries" });
    }
  });

  // Image upload endpoint for books
  app.post("/api/upload/book-image", async (req: Request, res: Response) => {
    try {
      const { imageData, fileName } = req.body;
      
      if (!imageData || !fileName) {
        return res.status(400).json({ error: "Image data and fileName are required" });
      }

      // In a real implementation, you would save to cloud storage like AWS S3
      // For this demo, we'll use a placeholder service that generates realistic book covers
      const imageUrl = `https://picsum.photos/300/400?random=${Date.now()}`;
      
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Book Rental System - Create rental with 15-day billing cycle
  app.post("/api/rentals/create", async (req, res) => {
    try {
      const { userId, productId, bookId, bookType, rentalPricePerCycle, sellerId, libraryId } = req.body;
      
      // Calculate next billing date (15 days from now)
      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + 15);

      const rentalData = {
        userId,
        productId,
        bookId,
        bookType, // 'physical' or 'ebook'
        rentalStartDate: new Date(),
        currentBillingCycle: 1,
        nextBillingDate,
        rentalPricePerCycle: Math.round(rentalPricePerCycle * 100), // Convert to cents
        totalAmountPaid: Math.round(rentalPricePerCycle * 100), // First cycle payment
        status: 'active',
        autoRenewal: true,
        sellerId,
        libraryId,
        returnRequestId: null
      };

      const rental = await storage.createBookRental(rentalData);
      
      // Create initial billing record
      const billingData = {
        rentalId: rental.id,
        billingCycle: 1,
        billingDate: new Date(),
        amount: Math.round(rentalPricePerCycle * 100),
        paymentStatus: 'paid',
        paymentMethod: 'default',
        transactionId: `txn_${Date.now()}`
      };
      
      await storage.createRentalBilling(billingData);

      res.json({ success: true, rental, message: "Book rental created successfully" });
    } catch (error) {
      console.error("Rental creation error:", error);
      res.status(500).json({ error: "Failed to create rental" });
    }
  });

  // Get user's rental history with billing details
  app.get("/api/rentals/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const rentals = await storage.getUserRentals(userId);
      res.json(rentals);
    } catch (error) {
      console.error("Error fetching user rentals:", error);
      res.status(500).json({ error: "Failed to fetch rentals" });
    }
  });

  // Create return request for rented or borrowed books
  app.post("/api/returns/request", async (req, res) => {
    try {
      const { userId, rentalId, loanId, bookType, bookTitle, returnReason, sellerId, libraryId } = req.body;
      
      const returnRequestData = {
        userId,
        rentalId,
        loanId,
        bookType, // 'rental' or 'loan'
        bookTitle,
        returnReason,
        requestDate: new Date(),
        status: 'pending',
        sellerId,
        libraryId,
        adminNotes: null,
        sellerNotes: null,
        processedBy: null,
        processedAt: null
      };

      const returnRequest = await storage.createReturnRequest(returnRequestData);
      
      // Update rental with return request ID if it's a rental
      if (rentalId) {
        await storage.updateRentalReturnRequest(rentalId, returnRequest.id);
      }

      res.json({ success: true, returnRequest, message: "Return request submitted successfully" });
    } catch (error) {
      console.error("Return request error:", error);
      res.status(500).json({ error: "Failed to create return request" });
    }
  });

  // Get return requests for admin/seller management
  app.get("/api/returns/manage/:role/:userId", async (req, res) => {
    try {
      const { role, userId } = req.params;
      let returnRequests;
      
      if (role === 'admin') {
        returnRequests = await storage.getAllReturnRequests();
      } else if (role === 'seller') {
        returnRequests = await storage.getSellerReturnRequests(parseInt(userId));
      } else {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      res.json(returnRequests);
    } catch (error) {
      console.error("Error fetching return requests:", error);
      res.status(500).json({ error: "Failed to fetch return requests" });
    }
  });

  // Process return request (approve/reject)
  app.post("/api/returns/process/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { status, notes, processedBy, isAdmin } = req.body;
      
      const updateData = {
        status,
        processedBy,
        processedAt: new Date(),
        ...(isAdmin ? { adminNotes: notes } : { sellerNotes: notes })
      };

      const updatedRequest = await storage.updateReturnRequest(requestId, updateData);
      
      // If approved, update rental status to 'returned'
      if (status === 'approved' && updatedRequest.rentalId) {
        await storage.updateRentalStatus(updatedRequest.rentalId, 'returned');
      }

      res.json({ success: true, returnRequest: updatedRequest, message: "Return request processed successfully" });
    } catch (error) {
      console.error("Return request processing error:", error);
      res.status(500).json({ error: "Failed to process return request" });
    }
  });

  // VyronaRead Books - Create new book with pricing
  app.post("/api/vyronaread/books", async (req, res) => {
    try {
      console.log("Creating book with data:", req.body);
      
      const { 
        title, author, isbn, category, copies, description, 
        publisher, publicationYear, language, fixedCostPrice, rentalPrice,
        imageUrl, additionalImages
      } = req.body;

      // Create product for Browse Books section first
      const productData = {
        name: title,
        description: `${author} - ${category || 'General'}`,
        price: Math.round((parseFloat(fixedCostPrice) || 0) * 100), // Convert to cents
        category: "books",
        module: "vyronaread",
        imageUrl: imageUrl || `https://picsum.photos/300/400?random=${Date.now()}`,
        metadata: {
          author,
          isbn: isbn || null,
          genre: category || "General",
          publisher: publisher || null,
          publicationYear: publicationYear || null,
          language: language || "English",
          format: "physical",
          fixedCostPrice: parseFloat(fixedCostPrice) || 0,
          rentalPrice: parseFloat(rentalPrice) || 0,
          sellerId: 1, // Default seller ID
          bookImages: [`https://picsum.photos/300/400?random=${Date.now()}`, `https://picsum.photos/300/400?random=${Date.now() + 1}`] // Sample book images
        }
      };

      console.log("Creating product with data:", productData);
      const newProduct = await storage.createProduct(productData);
      console.log("Product created:", newProduct);

      // Also create physical book record for library management
      const bookData = {
        libraryId: 1, // Default seller library
        title,
        author,
        isbn: isbn || null,
        category: category || null,
        copies: copies || 1,
        available: copies || 1,
        publisher: publisher || null,
        publicationYear: publicationYear || null,
        language: language || "English",
        location: null,
        fixedCostPrice: parseFloat(fixedCostPrice).toString() || "0.00",
        rentalPrice: parseFloat(rentalPrice).toString() || "0.00"
      };

      console.log("Creating physical book with data:", bookData);
      let newBook = null;
      try {
        newBook = await storage.createPhysicalBook(bookData);
        console.log("Physical book created:", newBook);
      } catch (bookError) {
        console.error("Physical book creation failed, but product created successfully:", bookError);
        // Continue with product-only response
      }

      res.json({
        success: true,
        book: newBook,
        product: newProduct,
        message: "Book created successfully with pricing information"
      });
    } catch (error) {
      console.error("Error creating book:", error);
      console.error("Error details:", error.stack);
      res.status(500).json({ 
        message: "Failed to create book", 
        error: error.message,
        details: error.stack 
      });
    }
  });

  // Get seller's rentals
  app.get("/api/seller/rentals", async (req: Request, res: Response) => {
    try {
      const sellerId = parseInt(req.query.sellerId as string);
      if (!sellerId) {
        return res.status(400).json({ error: "Seller ID is required" });
      }
      
      // Get rentals for this seller
      const rentals = await storage.getSellerRentals(sellerId);
      res.json(rentals);
    } catch (error) {
      console.error("Error fetching seller rentals:", error);
      res.status(500).json({ error: "Failed to fetch seller rentals" });
    }
  });

  // Get seller's return requests
  app.get("/api/seller/return-requests", async (req: Request, res: Response) => {
    try {
      const sellerId = parseInt(req.query.sellerId as string);
      if (!sellerId) {
        return res.status(400).json({ error: "Seller ID is required" });
      }
      
      const returnRequests = await storage.getSellerReturnRequests(sellerId);
      res.json(returnRequests);
    } catch (error) {
      console.error("Error fetching seller return requests:", error);
      res.status(500).json({ error: "Failed to fetch seller return requests" });
    }
  });

  // VyronaSocial Group Buy Products - Seller creates group buy products
  app.post("/api/group-buy/products", async (req, res) => {
    try {
      const productData = {
        ...req.body,
        isApproved: true // Auto-approve without admin requirement
      };
      
      // Validate minimum quantity requirements
      if (productData.minQuantity < 4) {
        return res.status(400).json({ message: "Minimum quantity must be at least 4 pieces" });
      }

      const groupBuyProduct = await storage.createGroupBuyProduct(productData);
      res.json(groupBuyProduct);
    } catch (error) {
      console.error("Error creating group buy product:", error);
      res.status(500).json({ message: "Failed to create group buy product" });
    }
  });

  // Get group buy products for sellers
  app.get("/api/group-buy/products", async (req, res) => {
    try {
      const sellerId = req.query.sellerId ? Number(req.query.sellerId) : undefined;
      const products = await storage.getGroupBuyProducts(sellerId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching group buy products:", error);
      res.status(500).json({ message: "Failed to fetch group buy products" });
    }
  });

  // Admin approve group buy products
  app.patch("/api/admin/group-buy/products/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      
      const product = await storage.approveGroupBuyProduct(Number(id), approvedBy);
      res.json(product);
    } catch (error) {
      console.error("Error approving group buy product:", error);
      res.status(500).json({ message: "Failed to approve group buy product" });
    }
  });

  // Get approved group buy products for customers
  app.get("/api/group-buy/approved-products", async (req, res) => {
    try {
      const products = await storage.getApprovedGroupBuyProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching approved group buy products:", error);
      res.status(500).json({ message: "Failed to fetch approved group buy products" });
    }
  });

  // Create group buy campaign
  app.post("/api/group-buy/campaigns", async (req, res) => {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // Campaign runs for 7 days
      
      const campaignData = {
        ...req.body,
        createdBy: req.session?.user?.id || 4, // Use current user or default to test user
        endDate: endDate
      };
      
      // Validate minimum requirements
      if (campaignData.targetQuantity < 4) {
        return res.status(400).json({ message: "Minimum target quantity is 4 across any seller products" });
      }

      const campaign = await storage.createGroupBuyCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating group buy campaign:", error);
      res.status(500).json({ message: "Failed to create group buy campaign" });
    }
  });

  // Get group buy campaigns
  app.get("/api/group-buy/campaigns", async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const campaigns = await storage.getGroupBuyCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching group buy campaigns:", error);
      res.status(500).json({ message: "Failed to fetch group buy campaigns" });
    }
  });

  // Get specific group buy campaign
  app.get("/api/group-buy/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getGroupBuyCampaign(Number(id));
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching group buy campaign:", error);
      res.status(500).json({ message: "Failed to fetch group buy campaign" });
    }
  });

  // Join group buy campaign participation
  app.post("/api/group-buy/participate", async (req, res) => {
    try {
      const participantData = req.body;
      const participant = await storage.joinGroupBuyCampaign(participantData);
      res.json(participant);
    } catch (error) {
      console.error("Error joining group buy campaign:", error);
      res.status(500).json({ message: "Failed to join campaign" });
    }
  });

  // Join group buy campaign
  app.post("/api/group-buy/campaigns/:id/join", async (req, res) => {
    try {
      const { id } = req.params;
      const participantData = {
        ...req.body,
        campaignId: Number(id)
      };

      const participant = await storage.joinGroupBuyCampaign(participantData);
      
      // Update campaign quantity
      await storage.updateCampaignQuantity(Number(id), participantData.quantity);
      
      res.json(participant);
    } catch (error) {
      console.error("Error joining group buy campaign:", error);
      res.status(500).json({ message: "Failed to join group buy campaign" });
    }
  });

  // Get campaign participants
  app.get("/api/group-buy/campaigns/:id/participants", async (req, res) => {
    try {
      const { id } = req.params;
      const participants = await storage.getGroupBuyParticipants(Number(id));
      res.json(participants);
    } catch (error) {
      console.error("Error fetching campaign participants:", error);
      res.status(500).json({ message: "Failed to fetch campaign participants" });
    }
  });

  // Library Browse API endpoints
  
  // Get available libraries
  app.get("/api/libraries", async (req, res) => {
    try {
      const libraries = await storage.getLibraries();
      res.json(libraries);
    } catch (error) {
      console.error("Error fetching libraries:", error);
      res.status(500).json({ message: "Failed to fetch libraries" });
    }
  });

  // Get library books
  app.get("/api/library-books", async (req, res) => {
    try {
      const libraryId = req.query.libraryId ? Number(req.query.libraryId) : undefined;
      const books = await storage.getLibraryBooks(libraryId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching library books:", error);
      res.status(500).json({ message: "Failed to fetch library books" });
    }
  });

  // Borrow book endpoint for library browse
  app.post("/api/borrow-book", async (req, res) => {
    try {
      const { bookId } = req.body;
      
      if (!bookId) {
        return res.status(400).json({ message: "Book ID is required" });
      }

      // Check if user is authenticated
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Please log in to borrow books" });
      }

      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }

      // Create book loan record
      const loan = await storage.createBookLoan({
        bookId: bookId,
        borrowerId: userId,
        libraryId: 1, // Default library ID
        borrowedAt: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'active'
      });

      res.json({
        success: true,
        loanId: loan.id,
        message: "Book borrowed successfully",
        dueDate: loan.dueDate
      });
    } catch (error) {
      console.error("Error borrowing book:", error);
      res.status(500).json({ message: "Failed to borrow book" });
    }
  });

  // Check user membership status
  app.get("/api/user/membership-status", async (req, res) => {
    try {
      // Check if user has active membership in database
      // For now, return default status showing no membership
      res.json({ 
        hasActiveMembership: false,
        membershipType: null,
        expiryDate: null
      });
    } catch (error: any) {
      console.error("Error checking membership status:", error);
      res.status(500).json({ message: "Failed to check membership status" });
    }
  });

  // Create library membership application
  app.post("/api/library/membership", async (req, res) => {
    try {
      const membershipData = req.body;
      const membership = await storage.createLibraryMembership(membershipData);
      
      // Create notification for admin and seller
      await storage.createNotification({
        userId: membershipData.libraryId, // Seller/Library ID
        type: "library_membership_request",
        title: "New Library Membership Application",
        message: `New membership application from ${membershipData.fullName} for book "${membershipData.bookTitle}"`,
        metadata: { membershipId: membership.id, bookId: membershipData.bookId }
      });

      res.json(membership);
    } catch (error) {
      console.error("Error creating library membership:", error);
      res.status(500).json({ message: "Failed to create library membership" });
    }
  });

  // Process borrowing order after membership payment/verification
  app.post("/api/process-borrow-order", async (req, res) => {
    try {
      const { bookId, customerInfo, borrowingInfo } = req.body;
      
      // Create borrowing order in database
      const borrowOrder = {
        bookId: parseInt(bookId),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        borrowDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        status: "pending_approval",
        libraryCardNumber: borrowingInfo.libraryCardNumber,
        purpose: borrowingInfo.purpose,
        deliveryAddress: borrowingInfo.deliveryAddress
      };

      // Create notification for seller/admin to review borrowing request
      await storage.createNotification({
        userId: 1, // Admin user ID
        type: "borrow_request",
        title: "New Book Borrowing Request",
        message: `${customerInfo.name} requested to borrow book ID ${bookId}. Contact: ${customerInfo.email}`,
        metadata: borrowOrder
      });

      res.json({ 
        success: true, 
        message: "Borrowing request submitted successfully. You will be contacted within 24 hours.",
        orderId: Date.now(), // Temporary order ID
        dueDate: borrowOrder.dueDate
      });
    } catch (error: any) {
      console.error("Error processing borrow order:", error);
      res.status(500).json({ message: "Failed to process borrowing request" });
    }
  });

  // Shopping Rooms API endpoints
  
  // Get user's shopping groups/rooms
  app.get("/api/social/groups", async (req, res) => {
    try {
      const userId = 1; // From session when auth is implemented
      const groups = await storage.getShoppingGroups(userId);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(groups);
    } catch (error) {
      console.error("Error fetching shopping groups:", error);
      res.status(500).json({ message: "Failed to fetch shopping groups" });
    }
  });

  // Old route removed - using isolated VyronaSocial API

  // Join room via code
  app.post("/api/social/groups/join", async (req, res) => {
    try {
      const userId = 1; // From session when auth is implemented
      const { roomCode } = req.body;
      
      // Find group by room code
      const groups = await storage.getShoppingGroups(0); // Get all groups
      const targetGroup = (groups as any[]).find(g => g.roomCode === roomCode);
      
      if (!targetGroup) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // Add user as member
      await storage.addGroupMember({
        groupId: targetGroup.id,
        userId: userId,
        role: "member",
        joinedAt: new Date()
      });
      
      res.json({ message: "Joined room successfully", group: targetGroup });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  // Get specific room details
  app.get("/api/social/groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const group = await storage.getShoppingGroup(Number(id));
      
      if (!group) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json(group);
    } catch (error) {
      console.error("Error fetching room details:", error);
      res.status(500).json({ message: "Failed to fetch room details" });
    }
  });

  // Get room members
  app.get("/api/social/groups/:id/members", async (req, res) => {
    try {
      const { id } = req.params;
      const members = await storage.getGroupMembers(Number(id));
      res.json(members);
    } catch (error) {
      console.error("Error fetching room members:", error);
      res.status(500).json({ message: "Failed to fetch room members" });
    }
  });

  // Delete group (only for group creator)
  app.delete("/api/social/groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get group details to check if user is creator
      const group = await storage.getShoppingGroup(Number(id));
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      if (group.creatorId !== userId) {
        return res.status(403).json({ message: "Only group creator can delete the group" });
      }
      
      // Delete the group
      await storage.deleteShoppingGroup(Number(id));
      
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Exit group (leave group)
  app.post("/api/social/groups/:id/exit", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is a member of the group
      const isMember = await storage.isUserRoomMember(userId, Number(id));
      if (!isMember) {
        return res.status(404).json({ message: "You are not a member of this group" });
      }
      
      // Get group details to check if user is creator
      const group = await storage.getShoppingGroup(Number(id));
      if (group && group.creatorId === userId) {
        return res.status(400).json({ message: "Group creator cannot exit. Please delete the group or transfer ownership." });
      }
      
      // Remove user from group
      await storage.removeUserFromGroup(userId, Number(id));
      
      res.json({ message: "Successfully exited the group" });
    } catch (error) {
      console.error("Error exiting group:", error);
      res.status(500).json({ message: "Failed to exit group" });
    }
  });

  // Get room messages
  app.get("/api/social/groups/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getGroupMessages(Number(id));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching room messages:", error);
      res.status(500).json({ message: "Failed to fetch room messages" });
    }
  });

  // Send message to room
  app.post("/api/social/groups/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = 1; // From session when auth is implemented
      const messageData = {
        ...req.body,
        groupId: Number(id),
        userId: userId,
        sentAt: new Date()
      };
      
      const message = await storage.addGroupMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get shared cart for room - accessible by all room members
  app.get("/api/rooms/:roomId/cart", async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.session?.user?.id;
      
      console.log("=== SHARED CART ENDPOINT ===");
      console.log("Room ID:", roomId);
      console.log("Session exists:", !!req.session);
      console.log("Session user:", req.session?.user);
      console.log("User ID:", userId);
      
      if (!userId) {
        console.log("No user ID found in session - returning empty cart");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify user is member of the room
      console.log("Checking membership for user", userId, "in room", roomId);
      const isMember = await storage.isUserRoomMember(userId, Number(roomId));
      console.log("User membership check result:", isMember);
      
      if (!isMember) {
        console.log("Access denied: User not a member of room");
        return res.status(403).json({ message: "Access denied: Not a member of this room" });
      }
      
      // Get all cart items for the room (shared cart)
      console.log("Fetching shared cart items for room:", roomId);
      const cartItems = await storage.getSharedCartItems(Number(roomId));
      console.log("=== SHARED CART ITEMS RETURNED ===", cartItems);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching shared cart:", error);
      res.status(500).json({ message: "Failed to fetch shared cart" });
    }
  });

  // Add item to shared cart - only room members can add
  app.post("/api/rooms/:roomId/cart/add", async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.session?.user?.id || 1;
      const userRole = req.session?.user?.role || 'customer';
      
      console.log("Adding item to shared cart:", { roomId, userId, userRole, body: req.body });
      
      // Verify user is member of the room
      const isMember = await storage.isUserRoomMember(userId, Number(roomId));
      if (!isMember) {
        return res.status(403).json({ message: "Access denied: Not a member of this room" });
      }
      
      const itemData = {
        ...req.body,
        userId: userId,
        roomId: Number(roomId)
      };
      
      const cartItem = await storage.addSharedCartItem(itemData);
      console.log("Shared cart item added successfully:", cartItem);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding item to shared cart:", error);
      res.status(500).json({ message: "Failed to add item to shared cart" });
    }
  });

  // Remove item from shared cart
  app.delete("/api/rooms/:roomId/cart/items/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;
      const success = await storage.removeCartItem(Number(itemId));
      
      if (success) {
        res.json({ message: "Item removed from cart" });
      } else {
        res.status(404).json({ message: "Item not found" });
      }
    } catch (error) {
      console.error("Error removing item from shared cart:", error);
      res.status(500).json({ message: "Failed to remove item from shared cart" });
    }
  });

  // Get room wishlist
  app.get("/api/social/groups/:id/wishlist", async (req, res) => {
    try {
      const { id } = req.params;
      const wishlist = await storage.getGroupWishlist(Number(id));
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching group wishlist:", error);
      res.status(500).json({ message: "Failed to fetch group wishlist" });
    }
  });

  // Add item to group wishlist
  app.post("/api/social/groups/:id/wishlist", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = 1; // From session when auth is implemented
      const wishlistData = {
        ...req.body,
        groupId: Number(id),
        addedBy: userId,
        addedAt: new Date()
      };
      
      const wishlistItem = await storage.addToGroupWishlist(wishlistData);
      res.json(wishlistItem);
    } catch (error) {
      console.error("Error adding to group wishlist:", error);
      res.status(500).json({ message: "Failed to add to group wishlist" });
    }
  });

  // User notifications
  app.get("/api/social/notifications", async (req, res) => {
    try {
      const userId = 1; // From session when auth is implemented
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/social/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(Number(id));
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // VyronaRead Purchase API
  app.post("/api/vyronaread/purchase", async (req, res) => {
    try {
      const { bookId, customerInfo, amount, paymentMethod } = req.body;
      
      // Create order record
      const order = await storage.createOrder({
        userId: 1, // Default user for now
        totalAmount: amount,
        status: "completed",
        module: "vyronaread",
        metadata: {
          type: "purchase",
          bookId,
          customerInfo,
          paymentMethod,
          purchaseType: "buy",
          accessType: "lifetime"
        }
      });

      res.json({
        success: true,
        orderId: order.id,
        message: "Book purchased successfully"
      });
    } catch (error) {
      console.error("Purchase error:", error);
      res.status(500).json({ message: "Failed to process purchase" });
    }
  });

  // VyronaRead Rental API
  app.post("/api/vyronaread/rental", async (req, res) => {
    try {
      const { bookId, customerInfo, amount, paymentMethod, duration } = req.body;
      
      // Calculate rental expiry date
      const currentDate = new Date();
      const expiryDate = new Date(currentDate.getTime() + (duration * 24 * 60 * 60 * 1000));
      
      // Create order record
      const order = await storage.createOrder({
        userId: 1, // Default user for now
        totalAmount: amount,
        status: "completed",
        module: "vyronaread",
        metadata: {
          type: "rental",
          bookId,
          customerInfo,
          paymentMethod,
          purchaseType: "rent",
          duration,
          rentalStart: currentDate.toISOString(),
          rentalExpiry: expiryDate.toISOString(),
          accessType: "temporary"
        }
      });

      res.json({
        success: true,
        orderId: order.id,
        expiryDate: expiryDate.toISOString(),
        message: `Book rented successfully for ${duration} days`
      });
    } catch (error) {
      console.error("Rental error:", error);
      res.status(500).json({ message: "Failed to process rental" });
    }
  });

  // VyronaRead Borrowing API
  app.post("/api/vyronaread/borrow", async (req, res) => {
    try {
      const { bookId, customerInfo, borrowingInfo } = req.body;
      
      // Create order record for borrowing request
      const order = await storage.createOrder({
        userId: 1, // Default user for now
        totalAmount: 0, // Free borrowing
        status: "pending",
        module: "vyronaread",
        metadata: {
          type: "borrow",
          bookId,
          customerInfo,
          borrowingInfo,
          purchaseType: "borrow",
          accessType: "library_loan",
          requestDate: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        orderId: order.id,
        message: "Borrow request submitted successfully"
      });
    } catch (error) {
      console.error("Borrowing error:", error);
      res.status(500).json({ message: "Failed to process borrow request" });
    }
  });

  // Setup working room creation routes
  setupRoomRoutes(app);
  
  // Setup isolated VyronaSocial API
  setupVyronaSocialAPI(app);

  // Video call notification endpoints
  app.get("/api/groups/:groupId/online-members", async (req, res) => {
    try {
      const { groupId } = req.params;
      const groupMembers = await storage.getGroupMembers(Number(groupId));
      
      // Filter for online members
      const onlineMembers = groupMembers.filter(member => {
        const userKey = `${member.userId}-${groupId}`;
        const onlineUser = onlineUsers.get(userKey);
        return onlineUser && onlineUser.ws.readyState === WebSocket.OPEN;
      }).map(member => {
        const userKey = `${member.userId}-${groupId}`;
        const onlineUser = onlineUsers.get(userKey);
        return {
          userId: member.userId,
          username: member.username || onlineUser?.username || `User ${member.userId}`,
          lastSeen: onlineUser?.lastSeen
        };
      });
      
      res.json(onlineMembers);
    } catch (error) {
      console.error("Error fetching online members:", error);
      res.status(500).json({ message: "Failed to fetch online members" });
    }
  });

  app.post("/api/groups/:groupId/start-video-call", async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.session?.user?.id || 1; // Default to user 1 for demo
      const username = req.session?.user?.username || 'codestudio.solutions@gmail.com';
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const callId = `call-${groupId}-${Date.now()}`;
      
      // Store call state
      groupCallStates.set(Number(groupId), {
        callId,
        initiator: userId,
        participants: [userId],
        startedAt: new Date()
      });
      
      // Notify all online group members
      const groupMembers = await storage.getGroupMembers(Number(groupId));
      
      groupMembers.forEach(member => {
        if (member.userId !== userId) {
          const userKey = `${member.userId}-${groupId}`;
          const onlineUser = onlineUsers.get(userKey);
          
          if (onlineUser && onlineUser.ws.readyState === WebSocket.OPEN) {
            onlineUser.ws.send(JSON.stringify({
              type: 'video-call-invite',
              callId,
              groupId: Number(groupId),
              initiator: userId,
              initiatorName: req.session?.user?.username || `User ${userId}`,
              timestamp: new Date().toISOString()
            }));
          }
        }
      });
      
      res.json({ 
        success: true, 
        callId,
        message: "Video call started, invitations sent to online members" 
      });
    } catch (error) {
      console.error("Error starting video call:", error);
      res.status(500).json({ message: "Failed to start video call" });
    }
  });

  app.post("/api/groups/:groupId/join-video-call", async (req, res) => {
    try {
      const { groupId } = req.params;
      const { callId } = req.body;
      const userId = req.session?.user?.id || 2; // Default to user 2 for demo (different from initiator)
      const username = req.session?.user?.username || 'riyaesh35@gmail.com';
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const callState = groupCallStates.get(Number(groupId));
      
      if (!callState || callState.callId !== callId) {
        return res.status(404).json({ message: "Video call not found or expired" });
      }
      
      // Add user to participants
      if (!callState.participants.includes(userId)) {
        callState.participants.push(userId);
      }
      
      // Get complete participant list with usernames
      const groupMembers = await storage.getGroupMembers(Number(groupId));
      const participantList = callState.participants.map(participantId => {
        const member = groupMembers.find(m => m.userId === participantId);
        return {
          userId: participantId,
          username: member?.username || (participantId === 1 ? 'codestudio.solutions@gmail.com' : 'riyaesh35@gmail.com'),
          joinedAt: new Date().toISOString()
        };
      });
      
      // Broadcast updated participant list to ALL participants (including the joiner)
      callState.participants.forEach(participantId => {
        const userKey = `${participantId}-${groupId}`;
        const onlineUser = onlineUsers.get(userKey);
        
        if (onlineUser && onlineUser.ws.readyState === WebSocket.OPEN) {
          onlineUser.ws.send(JSON.stringify({
            type: 'call-participants-updated',
            callId,
            groupId: Number(groupId),
            participants: participantList,
            newJoiner: participantId === userId ? null : {
              userId,
              username: username
            },
            timestamp: new Date().toISOString()
          }));
        }
      });
      
      res.json({ 
        success: true, 
        message: "Joined video call successfully",
        participants: callState.participants 
      });
    } catch (error) {
      console.error("Error joining video call:", error);
      res.status(500).json({ message: "Failed to join video call" });
    }
  });

  app.post("/api/groups/:groupId/end-video-call", async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const callState = groupCallStates.get(Number(groupId));
      
      if (callState) {
        // Notify all participants that call ended
        const groupMembers = await storage.getGroupMembers(Number(groupId));
        
        callState.participants.forEach(participantId => {
          const userKey = `${participantId}-${groupId}`;
          const onlineUser = onlineUsers.get(userKey);
          
          if (onlineUser && onlineUser.ws.readyState === WebSocket.OPEN) {
            onlineUser.ws.send(JSON.stringify({
              type: 'video-call-ended',
              callId: callState.callId,
              groupId: Number(groupId),
              endedBy: userId,
              timestamp: new Date().toISOString()
            }));
          }
        });
        
        // Remove call state
        groupCallStates.delete(Number(groupId));
      }
      
      res.json({ success: true, message: "Video call ended" });
    } catch (error) {
      console.error("Error ending video call:", error);
      res.status(500).json({ message: "Failed to end video call" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'user-online') {
          const { userId, username, groupId } = data;
          const userKey = `${userId}-${groupId}`;
          
          // Store online user
          onlineUsers.set(userKey, {
            userId,
            username,
            groupId,
            ws,
            lastSeen: new Date()
          });
          
          console.log(`User ${username} (${userId}) is now online in group ${groupId}`);
          
          // Notify other group members about online status
          const groupMembers = await storage.getGroupMembers(groupId);
          
          groupMembers.forEach(member => {
            if (member.userId !== userId) {
              const memberKey = `${member.userId}-${groupId}`;
              const onlineMember = onlineUsers.get(memberKey);
              
              if (onlineMember && onlineMember.ws.readyState === WebSocket.OPEN) {
                onlineMember.ws.send(JSON.stringify({
                  type: 'user-status-changed',
                  userId,
                  username,
                  status: 'online',
                  groupId,
                  timestamp: new Date().toISOString()
                }));
              }
            }
          });
        }
        
        if (data.type === 'ping') {
          // Update last seen time
          Object.values(onlineUsers).forEach(user => {
            if (user.ws === ws) {
              user.lastSeen = new Date();
            }
          });
          
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      
      // Remove user from online users and notify group members
      for (const [userKey, onlineUser] of onlineUsers.entries()) {
        if (onlineUser.ws === ws) {
          const { userId, username, groupId } = onlineUser;
          
          // Notify other group members about offline status
          storage.getGroupMembers(groupId).then(groupMembers => {
            groupMembers.forEach(member => {
              if (member.userId !== userId) {
                const memberKey = `${member.userId}-${groupId}`;
                const onlineMember = onlineUsers.get(memberKey);
                
                if (onlineMember && onlineMember.ws.readyState === WebSocket.OPEN) {
                  onlineMember.ws.send(JSON.stringify({
                    type: 'user-status-changed',
                    userId,
                    username,
                    status: 'offline',
                    groupId,
                    timestamp: new Date().toISOString()
                  }));
                }
              }
            });
          });
          
          onlineUsers.delete(userKey);
          break;
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Cleanup inactive connections every 60 seconds
  setInterval(() => {
    const now = new Date();
    for (const [userKey, onlineUser] of onlineUsers.entries()) {
      const timeSinceLastSeen = now.getTime() - onlineUser.lastSeen.getTime();
      
      // Only remove if user hasn't been seen for 5 minutes AND connection is closed
      if (timeSinceLastSeen > 300000 && onlineUser.ws.readyState !== WebSocket.OPEN) {
        console.log(`Removing inactive user: ${userKey}`);
        onlineUsers.delete(userKey);
      }
    }
  }, 60000);
  
  return httpServer;
}
