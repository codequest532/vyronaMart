import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProductSchema, insertCartItemSchema, insertGameScoreSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you'd create a session/JWT here
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, mobile, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Create new user with bonus coins
      const newUser = await storage.createUser({
        username,
        email,
        mobile: mobile || null,
        password,
        vyronaCoins: 500, // Welcome bonus
        xp: 0,
        level: 1
      });
      
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

      // In a real app, you would send email/SMS here
      // For demo purposes, we'll return the OTP in response
      res.json({ 
        message: "OTP sent successfully",
        // Remove this in production - only for demo
        otp: otp,
        expiresAt: expiresAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and reset password
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      
      const verification = await storage.getOtpVerification(email, otp, "password_reset");
      
      if (!verification || verification.verified) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      if (new Date() > verification.expiresAt) {
        return res.status(400).json({ message: "OTP has expired" });
      }

      // Mark OTP as verified
      await storage.markOtpAsVerified(verification.id);

      // Update user password
      await storage.updateUserPassword(email, newPassword);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
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

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { module, category } = req.query;
      const products = await storage.getProducts(
        module as string,
        category as string
      );
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
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

  // Shopping room routes
  app.get("/api/shopping-rooms", async (req, res) => {
    try {
      const rooms = await storage.getShoppingRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
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

  // Achievement routes
  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
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

  const httpServer = createServer(app);
  return httpServer;
}
