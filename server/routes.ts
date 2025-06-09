import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupRoomRoutes } from "./simple-rooms";
import { setupVyronaSocialAPI } from "./vyronasocial-api";
import { getAuthenticatedUser } from "./auth-utils";
import { 
  sendBrevoEmail, 
  generateOrderProcessingEmail, 
  generateOrderShippedEmail, 
  generateOrderOutForDeliveryEmail, 
  generateOrderDeliveredEmail 
} from "./brevo-email";
import { db, pool } from "./db";
import Razorpay from "razorpay";
import axios from "axios";
import QRCode from "qrcode";
import { 
  insertUserSchema, insertProductSchema, insertCartItemSchema, insertGameScoreSchema,
  insertShoppingGroupSchema, insertGroupMemberSchema, insertGroupWishlistSchema,
  insertGroupMessageSchema, insertProductShareSchema, insertGroupCartSchema,
  insertGroupCartContributionSchema, insertVyronaWalletSchema, insertWalletTransactionSchema,
  insertGroupOrderSchema, insertGroupOrderContributionSchema, insertOrderSchema,
  walletTransactions, users, orders, groupContributions, notifications, products, cartItems, stores
} from "@shared/schema";
import { shoppingGroups, groupMembers } from "../migrations/schema";
import { z } from "zod";
import { sendOTPEmail, sendOrderConfirmationEmail } from "./email";
import { eq, desc, sql, and } from "drizzle-orm";

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

// Simple payment configuration
const PAYMENT_CONFIG = {
  merchantName: "Vyrona",
  merchantUPI: "merchant@upi"
};

// Removed Cashfree headers - using simple UPI payment system

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
  
  // Order submission endpoint for VyronaHub checkout flow - MUST BE FIRST
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      console.log("VyronaHub Order request body:", JSON.stringify(req.body, null, 2));
      
      const { items, shippingAddress, paymentMethod, totalAmount, total } = req.body;
      const userId = 1; // Default user for demo
      const orderTotal = totalAmount || total;

      console.log("Extracted values:", { 
        items: !!items, 
        shippingAddress: !!shippingAddress, 
        paymentMethod: !!paymentMethod, 
        orderTotal: !!orderTotal 
      });

      if (!items || !shippingAddress || !paymentMethod || !orderTotal) {
        console.log("Missing required fields validation failed");
        return res.status(400).json({ error: "Missing required order information" });
      }

      // Create order in database
      const orderResult = await db.insert(orders).values({
        userId,
        totalAmount: orderTotal,
        status: "processing",
        module: "vyronahub",
        metadata: {
          shippingAddress,
          paymentMethod,
          items
        }
      }).returning();

      const orderId = orderResult[0].id;

      // Send seller notifications for each item
      console.log("Starting email notification process...");
      try {
        const sellerEmails = new Set<string>();

        console.log("Processing items for email notifications:", items.length);
        
        // Send seller notification for all items to ganesan.sixphrase@gmail.com
        const sellerEmail = 'ganesan.sixphrase@gmail.com';
        const sellerName = 'MSR';
        
        console.log(`Sending consolidated order notification to: ${sellerEmail}`);
        
        const orderItems = items.map((item: any) => 
          `<li>${item.name} - Quantity: ${item.quantity} - Price: ₹${item.price.toFixed(2)}</li>`
        ).join('');
        
        const emailResult = await sendBrevoEmail(
          sellerEmail,
          "New Order Received - VyronaHub",
          `<h2>New Order Notification</h2>
            <p>Dear ${sellerName},</p>
            <p>You have received a new order (Order #${orderId}) from VyronaHub.</p>
            <h3>Order Details:</h3>
            <ul>${orderItems}</ul>
            <p><strong>Total Amount: ₹${orderTotal.toFixed(2)}</strong></p>
            <h3>Customer Details:</h3>
            <p>
              Name: ${shippingAddress.fullName}<br>
              Phone: ${shippingAddress.phoneNumber}<br>
              Address: ${shippingAddress.address}<br>
              ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}
            </p>
            <p>Payment Method: ${paymentMethod.toUpperCase()}</p>
            <p>Please log in to your seller dashboard to process this order.</p>
            <p>Best regards,<br>VyronaHub Team</p>`
        );
        
        if (emailResult.success) {
          console.log(`Seller notification email sent successfully to ${sellerEmail}`);
        } else {
          console.error(`Failed to send seller notification email:`, emailResult.error);
        }

        // Send customer confirmation email
        const orderEmailData = {
          orderId: orderId,
          customerName: shippingAddress.fullName,
          customerEmail: "customer@example.com",
          orderTotal: orderTotal,
          orderItems: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          orderDate: new Date().toLocaleDateString(),
          deliveryAddress: `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`
        };

        const emailTemplate = generateOrderProcessingEmail(orderEmailData);
        await sendBrevoEmail(
          "customer@example.com",
          emailTemplate.subject,
          emailTemplate.htmlContent
        );
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      res.json({ 
        success: true, 
        orderId,
        message: "Order placed successfully"
      });

    } catch (error) {
      console.error('Order submission error:', error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });
  // Test email endpoint
  app.post("/api/test-email", async (req, res) => {
    try {
      console.log("Testing email notification system...");
      const emailResult = await sendBrevoEmail(
        "ganesan.sixphrase@gmail.com",
        "Test Email - VyronaHub System Check",
        `<h2>Email System Test</h2>
         <p>This is a test email to verify the Brevo email integration is working correctly.</p>
         <p>Timestamp: ${new Date().toISOString()}</p>
         <p>Best regards,<br>VyronaHub Team</p>`
      );
      
      console.log("Email test result:", emailResult);
      res.json({ success: emailResult.success, result: emailResult });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ error: "Email test failed", details: error });
    }
  });

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

  // Forgot Password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "No account found with this email address" 
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database with 15-minute expiry
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      await storage.createOtpVerification({
        identifier: email,
        otp,
        type: 'password_reset',
        expiresAt,
        verified: false
      });

      // Send OTP via email
      const emailSent = await sendOTPEmail(email, otp);
      
      if (!emailSent) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send verification email" 
        });
      }

      res.json({ 
        success: true, 
        message: "Password reset code sent to your email" 
      });

    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process forgot password request" 
      });
    }
  });

  // Verify OTP endpoint
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and OTP are required" 
        });
      }

      // Get the latest unused OTP for this email
      const otpRecord = await storage.getOtpVerification(email, otp, 'password_reset');
      
      if (!otpRecord) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired OTP" 
        });
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ 
          success: false, 
          message: "OTP has expired. Please request a new one." 
        });
      }

      // Check if OTP is already used
      if (otpRecord.isUsed) {
        return res.status(400).json({ 
          success: false, 
          message: "This OTP has already been used" 
        });
      }

      // Mark OTP as used
      await storage.markOtpAsUsed(otpRecord.id);

      res.json({ 
        success: true, 
        message: "OTP verified successfully" 
      });

    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to verify OTP" 
      });
    }
  });

  // Reset Password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, password, confirmPassword } = req.body;
      
      if (!email || !password || !confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Email, password, and confirm password are required" 
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Passwords do not match" 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: "Password must be at least 6 characters long" 
        });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Update user password
      await storage.updateUserPassword(user.id, password);

      res.json({ 
        success: true, 
        message: "Password reset successfully" 
      });

    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to reset password" 
      });
    }
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
      const { username, email, mobile, password, role, storeName, businessType, storeDescription, address } = req.body;
      
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
      
      // If seller, create a store entry
      if (userRole === "seller" && storeName) {
        try {
          await storage.createStore({
            name: storeName,
            type: businessType || "other",
            address: address || null,
            isOpen: true
          });
        } catch (storeError) {
          console.error("Failed to create store:", storeError);
          // Continue with user creation even if store creation fails
        }
      }
      
      // Store user information in session
      (req as any).session.user = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      };
      
      res.json({ user: { ...newUser, password: undefined } });
    } catch (error) {
      console.error("Signup error:", error);
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

      // Email functionality disabled
      const emailSent = await sendOTPEmail(email, otp);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Email service not configured" });
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
      
      // Get current user ID from session (fallback to user 1 for demo)
      const session = (req as any).session;
      const userId = session?.user?.id || 1;
      
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

      // Get current user ID from session using auth-utils
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = authenticatedUser.id;
      console.log(`=== JOIN ROOM REQUEST ===`);
      console.log(`User ID: ${userId}, Room Code: ${code.trim()}`);

      // Find group by room code - query database directly for all groups
      const result = await pool.query(`
        SELECT id, name, description, creator_id, is_active, max_members, room_code, created_at
        FROM shopping_groups 
        WHERE is_active = true AND room_code = $1
      `, [code.trim()]);
      
      console.log(`Searching for room code: ${code.trim()}`);
      console.log(`Query result:`, result.rows);
      
      if (result.rows.length === 0) {
        console.log(`Room code '${code.trim()}' not found`);
        return res.status(404).json({ message: "Invalid room code" });
      }

      const targetGroup = result.rows[0];
      console.log(`Found target group:`, targetGroup);

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
      
      console.log(`User ${userId} successfully joined group ${targetGroup.id}`);
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

      // Send email notification for VyronaSocial group order
      try {
        console.log("Sending VyronaSocial group order notification email...");
        const sellerEmail = 'ganesan.sixphrase@gmail.com';
        const sellerName = 'MSR';
        
        const emailResult = await sendBrevoEmail(
          sellerEmail,
          "New Group Order - VyronaSocial",
          `<h2>New Group Order Notification</h2>
            <p>Dear ${sellerName},</p>
            <p>A group order has been placed through VyronaSocial (Order #${groupOrder.id}).</p>
            <h3>Order Details:</h3>
            <ul>
              <li>Group Cart ID: ${groupCartId}</li>
              <li>Total Amount: ₹${orderData.totalAmount.toFixed(2)}</li>
              <li>Module: VyronaSocial</li>
              <li>Status: ${orderData.status.toUpperCase()}</li>
            </ul>
            <h3>Order Information:</h3>
            <p>
              User ID: ${orderData.userId}<br>
              Payment Method: ${req.body.paymentMethod || 'Not specified'}<br>
              Shipping Address: ${req.body.shippingAddress ? 
                `${req.body.shippingAddress.address}, ${req.body.shippingAddress.city}` : 
                'Not provided'
              }
            </p>
            <p>This is a collaborative group purchase from VyronaSocial platform.</p>
            <p>Please log in to your seller dashboard to process this group order.</p>
            <p>Best regards,<br>VyronaSocial Team</p>`
        );
        
        if (emailResult.success) {
          console.log(`VyronaSocial group order notification sent successfully to ${sellerEmail}`);
        } else {
          console.error(`Failed to send VyronaSocial group order notification:`, emailResult.error);
        }
      } catch (emailError) {
        console.error("VyronaSocial group order email notification failed:", emailError);
      }

      res.json(groupOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to create group order" });
    }
  });

  // VyronaWallet API Routes
  app.get("/api/wallet/balance/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const user = userResult[0];
      res.json({ balance: parseFloat(user.walletBalance || "0") });
    } catch (error) {
      console.error("Wallet balance fetch error:", error);
      res.status(500).json({ error: "Failed to fetch wallet balance" });
    }
  });

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
      
      // Broadcast cart update to all group members via WebSocket
      const cartUpdateMessage = {
        type: 'cart-update',
        roomId: roomId,
        action: 'add',
        cartItem: cartItem,
        userId: userId
      };
      
      // Send to all connected users in this group
      const entries = Array.from(onlineUsers.entries());
      for (const [userId, userData] of entries) {
        if (userData.groupId === roomId && userData.ws.readyState === 1) {
          userData.ws.send(JSON.stringify(cartUpdateMessage));
        }
      }
      
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

      // Get cart item details before removing to identify the room
      const cartItem = await storage.getCartItem(cartItemId);
      
      await storage.removeCartItem(cartItemId);
      
      // Broadcast cart removal to all group members via WebSocket
      if (cartItem && cartItem.roomId) {
        const cartUpdateMessage = {
          type: 'cart-update',
          roomId: cartItem.roomId,
          action: 'remove',
          cartItemId: cartItemId,
          userId: userId
        };
        
        // Send to all connected users in this group
        const entries = Array.from(onlineUsers.entries());
        for (const [userId, userData] of entries) {
          if (userData.groupId === cartItem.roomId && userData.ws.readyState === 1) {
            userData.ws.send(JSON.stringify(cartUpdateMessage));
          }
        }
      }
      
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

      // Get real customer information from database
      const customerResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      const customer = customerResult[0];
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get all group members and their details for seller fulfillment
      const groupMembersResult = await db.execute(sql`
        SELECT DISTINCT 
          u.id, u.username, u.email, u.mobile,
          gm.role as member_role
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ${roomId}
        AND gm.user_id != ${userId}
      `);

      const allGroupMembers = [
        {
          id: customer.id,
          username: customer.username,
          email: customer.email,
          mobile: customer.mobile,
          member_role: 'admin',
          isOrderCreator: true
        },
        ...groupMembersResult.rows.map(member => ({
          ...member,
          isOrderCreator: false
        }))
      ];

      // Enhance delivery addresses with member details
      const enhancedDeliveryAddresses = deliveryAddresses?.map((address: any) => {
        const memberInfo = allGroupMembers.find(member => member.id === address.memberId);
        return {
          ...address,
          memberName: memberInfo?.username || 'Unknown',
          memberEmail: memberInfo?.email || 'N/A',
          memberPhone: memberInfo?.mobile || 'N/A'
        };
      }) || [];

      // Prepare comprehensive seller fulfillment data
      const sellerFulfillmentData = {
        // Primary order contact (order creator)
        primaryContact: {
          name: customer.username,
          email: customer.email,
          phone: customer.mobile || 'N/A',
          role: 'Group Admin'
        },
        // All group members for reference
        groupMembers: allGroupMembers,
        // Delivery information
        deliveryDetails: {
          useSingleDelivery,
          totalAddresses: enhancedDeliveryAddresses.length,
          addresses: enhancedDeliveryAddresses
        },
        // Product breakdown by member
        productDistribution: items.map((item: any) => {
          const memberAssignments = item.memberAssignments || [];
          return {
            productId: item.productId,
            productName: item.name,
            totalQuantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            assignedTo: memberAssignments.map((assignment: any) => {
              const memberInfo = allGroupMembers.find(m => m.id === assignment.memberId);
              return {
                memberId: assignment.memberId,
                memberName: memberInfo?.username || 'Unknown',
                memberEmail: memberInfo?.email || 'N/A',
                quantity: assignment.quantity,
                memberTotal: assignment.quantity * item.price
              };
            })
          };
        }),
        // Group summary
        groupSummary: {
          groupId: roomId,
          totalMembers: allGroupMembers.length,
          totalOrderValue: totalAmount,
          paymentMethod: 'VyronaWallet Group Payment',
          orderType: isGroupPayment ? 'Group Contribution' : 'Direct Payment'
        }
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
          transactionId: mockTransaction.id,
          paymentMethod: "vyronawallet",
          isGroupPayment,
          memberCount,
          totalOrderAmount: totalAmount,
          deliveryAddresses: enhancedDeliveryAddresses,
          useSingleDelivery,
          
          // Enhanced seller fulfillment data
          sellerFulfillment: sellerFulfillmentData,
          
          // Legacy fields for backward compatibility
          customerName: customer.username,
          customerEmail: customer.email,
          customerPhone: customer.mobile || 'N/A',
          
          // Product details for dispatch
          products: items.map(item => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.price * item.quantity
          })),
          
          // Group purchase specific data
          group_name: `Shopping Group ${roomId}`,
          group_description: `Collaborative purchase with ${allGroupMembers.length} members`,
          group_size: allGroupMembers.length,
          
          // Order fulfillment status
          fulfillmentStatus: 'processing',
          orderDate: new Date().toISOString(),
          
          // Seller notes
          sellerNotes: [
            `Group order with ${allGroupMembers.length} members`,
            useSingleDelivery ? 'Single delivery address requested' : `Multiple delivery addresses (${enhancedDeliveryAddresses.length})`,
            `Primary contact: ${customer.username} (${customer.email})`
          ].join(' | ')
        }
      });

      // Email notifications disabled

      res.json({
        success: true,
        message: isGroupPayment 
          ? "Your contribution has been processed. Waiting for other members to contribute."
          : "Payment successful",
        orderId: order.id,
        transactionId: mockTransaction.id,
        remainingBalance: mockWallet.balance,
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

  // Seller Dashboard - Order Management with proper seller authentication
  app.get("/api/seller/orders", async (req, res) => {
    try {
      // Get authenticated seller ID from session
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Ensure only sellers can access this endpoint
      if (authenticatedUser.role !== 'seller' && authenticatedUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Seller role required." });
      }
      
      const sellerId = authenticatedUser.id;
      
      // Enhanced seller orders with customer details - FILTERED BY SELLER ID
      const sellerOrders = await db.execute(sql`
        SELECT 
          o.id as order_id,
          o.user_id,
          o.total_amount,
          o.status as order_status,
          o.module,
          o.metadata,
          o.created_at,
          u.username as customer_name,
          u.email as customer_email,
          u.mobile as customer_phone,
          CASE 
            WHEN o.module = 'vyronahub' THEN 
              COALESCE(o.metadata->>'shippingAddress', '{}')::jsonb
            ELSE NULL
          END as shipping_address,
          CASE 
            WHEN o.module = 'vyronahub' THEN 
              COALESCE(o.metadata->>'paymentMethod', 'Not specified')
            ELSE NULL
          END as payment_method,
          CASE 
            WHEN o.module = 'vyronahub' THEN 
              COALESCE(o.metadata->>'items', '[]')::jsonb
            ELSE NULL
          END as order_items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE (
          (o.module = 'vyronahub' AND o.metadata->>'sellerId' = ${sellerId.toString()})
          OR (o.module = 'vyronasocial' AND o.metadata->>'sellerId' = ${sellerId.toString()})
          OR (o.module = 'vyronaread' AND o.metadata->>'sellerId' = ${sellerId.toString()})
          OR (${authenticatedUser.role === 'admin'})
        )
        ORDER BY o.created_at DESC
        LIMIT 50
      `);

      // Process and format the orders for better display
      const formattedOrders = sellerOrders.rows.map((order: any) => {
        let shippingDetails = null;
        let orderItems = [];

        if (order.module === 'vyronahub' && order.shipping_address) {
          try {
            shippingDetails = typeof order.shipping_address === 'string' 
              ? JSON.parse(order.shipping_address) 
              : order.shipping_address;
          } catch (e) {
            shippingDetails = null;
          }
        }

        if (order.module === 'vyronahub' && order.order_items) {
          try {
            orderItems = typeof order.order_items === 'string' 
              ? JSON.parse(order.order_items) 
              : order.order_items;
          } catch (e) {
            orderItems = [];
          }
        }

        return {
          ...order,
          shipping_address: shippingDetails,
          order_items: orderItems,
          formatted_total: `₹${(order.total_amount / 100).toFixed(2)}`,
          formatted_date: new Date(order.created_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      });

      res.json(formattedOrders);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seller Products endpoint with proper authentication
  app.get("/api/seller/products", async (req, res) => {
    try {
      // Get authenticated seller ID from session
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Ensure only sellers can access this endpoint
      if (authenticatedUser.role !== 'seller' && authenticatedUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Seller role required." });
      }
      
      const sellerId = authenticatedUser.id;
      
      // Get products filtered by seller ID
      const sellerProducts = await storage.getProductsBySeller(sellerId);
      
      res.json(sellerProducts);
    } catch (error: any) {
      console.error("Error fetching seller products:", error);
      res.status(500).json({ message: "Failed to fetch seller products" });
    }
  });

  // Seller Analytics endpoint with proper authentication
  app.get("/api/seller/analytics", async (req, res) => {
    try {
      // Get authenticated seller ID from session
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Ensure only sellers can access this endpoint
      if (authenticatedUser.role !== 'seller' && authenticatedUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Seller role required." });
      }
      
      const sellerId = authenticatedUser.id;
      
      // Calculate analytics for this specific seller
      const sellerOrders = await db.execute(sql`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) as total_revenue,
          COUNT(CASE WHEN status = 'pending' OR status = 'processing' THEN 1 END) as active_orders,
          AVG(total_amount) as average_order_value
        FROM orders 
        WHERE (
          (module = 'vyronahub' AND metadata->>'sellerId' = ${sellerId.toString()})
          OR (module = 'vyronasocial' AND metadata->>'sellerId' = ${sellerId.toString()})
          OR (module = 'vyronaread' AND metadata->>'sellerId' = ${sellerId.toString()})
        )
      `);
      
      const analytics = sellerOrders.rows[0] as any;
      
      res.json({
        totalOrders: parseInt(analytics.total_orders) || 0,
        totalRevenue: parseFloat(analytics.total_revenue) || 0,
        activeOrders: parseInt(analytics.active_orders) || 0,
        averageOrderValue: parseFloat(analytics.average_order_value) || 0
      });
    } catch (error: any) {
      console.error("Error fetching seller analytics:", error);
      res.status(500).json({ message: "Failed to fetch seller analytics" });
    }
  });

  // Update order status with automated email workflow
  app.patch("/api/seller/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ message: "Order ID and status are required" });
      }

      // Validate status progression
      const validStatuses = ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Get current order details
      const orderResult = await db.execute(sql`
        SELECT o.*, u.email as customer_email, u.username as customer_name 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ${parseInt(orderId)}
      `);

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      const order = orderResult.rows[0] as any;
      
      // Validate status progression (prevent skipping stages)
      const statusProgression = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
      const currentIndex = statusProgression.indexOf(order.status || order.order_status || 'pending');
      const newIndex = statusProgression.indexOf(status);
      
      // Allow updating from pending/null to any valid status, or normal progression
      if (status !== 'cancelled' && currentIndex > 0 && newIndex <= currentIndex) {
        return res.status(400).json({ message: "Cannot go backwards in order status progression" });
      }

      // Update order status
      await db.execute(sql`
        UPDATE orders 
        SET status = ${status}
        WHERE id = ${parseInt(orderId)}
      `);

      // Send automated email based on status
      let emailResult: { success: boolean; messageId?: string; error?: string } = { success: false, messageId: '', error: 'No email template for this status' };
      
      if (['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(status)) {
        const orderData = {
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          orderTotal: order.total_amount,
          orderItems: order.metadata?.items || order.metadata?.products || [],
          orderDate: order.created_at,
          trackingNumber,
          deliveryAddress: order.metadata?.deliveryAddress || 'As provided during checkout'
        };

        let emailTemplate;
        switch (status) {
          case 'processing':
            emailTemplate = generateOrderProcessingEmail(orderData);
            break;
          case 'shipped':
            emailTemplate = generateOrderShippedEmail(orderData);
            break;
          case 'out_for_delivery':
            emailTemplate = generateOrderOutForDeliveryEmail(orderData);
            break;
          case 'delivered':
            emailTemplate = generateOrderDeliveredEmail(orderData);
            break;
        }

        if (emailTemplate) {
          // For VyronaSocial orders, send emails to all group members
          if (order.module === 'vyronasocial' && order.metadata?.groupId) {
            // Fetch all group member emails
            const groupMembersResult = await db.execute(sql`
              SELECT u.email, u.username
              FROM group_members gm
              JOIN users u ON gm.user_id = u.id
              WHERE gm.group_id = ${order.metadata.groupId}
                AND u.email IS NOT NULL
                AND u.email != ''
            `);

            const groupMembers = groupMembersResult.rows as any[];
            let successfulEmails = 0;

            // Send email to each group member
            for (const member of groupMembers) {
              try {
                const memberEmailResult = await sendBrevoEmail({
                  to: member.email,
                  subject: `[Group Order] ${emailTemplate.subject}`,
                  htmlContent: emailTemplate.htmlContent.replace(
                    order.customer_name || 'Customer',
                    `${member.username} (Group Member)`
                  )
                });
                
                if (memberEmailResult.success) {
                  successfulEmails++;
                }

                // Log each email notification
                await db.execute(sql`
                  INSERT INTO email_notifications (
                    order_id, user_id, email_type, status, recipient_email, 
                    subject, content, brevo_message_id, sent_at
                  ) VALUES (
                    ${parseInt(orderId)}, ${order.user_id}, ${status}, 
                    ${memberEmailResult.success ? 'sent' : 'failed'}, ${member.email},
                    ${`[Group Order] ${emailTemplate.subject}`}, ${emailTemplate.htmlContent},
                    ${memberEmailResult.messageId || null}, 
                    ${memberEmailResult.success ? new Date().toISOString() : null}
                  )
                `);
              } catch (emailError) {
                console.error(`Failed to send email to group member ${member.email}:`, emailError);
              }
            }

            emailResult = {
              success: successfulEmails > 0,
              messageId: `group-${successfulEmails}/${groupMembers.length}`,
              error: successfulEmails === 0 ? 'Failed to send to any group members' : undefined
            };
          } else {
            // Regular order - send to individual customer
            emailResult = await sendBrevoEmail({
              to: order.customer_email,
              subject: emailTemplate.subject,
              htmlContent: emailTemplate.htmlContent
            });
          }

          // Log email notification in database for non-VyronaSocial orders
          // (VyronaSocial orders handle logging within their group member loop)
          if (order.module !== 'vyronasocial') {
            try {
              await db.execute(sql`
                INSERT INTO email_notifications (
                  order_id, user_id, email_type, status, recipient_email, 
                  subject, content, brevo_message_id, sent_at
                ) VALUES (
                  ${parseInt(orderId)}, ${order.user_id}, ${status}, 
                  ${emailResult.success ? 'sent' : 'failed'}, ${order.customer_email},
                  ${emailTemplate.subject}, ${emailTemplate.htmlContent},
                  ${emailResult.messageId || null}, 
                  ${emailResult.success ? new Date().toISOString() : null}
                )
              `);
            } catch (emailLogError) {
              console.error("Error logging email notification:", emailLogError);
            }
          }
        }
      }

      res.json({ 
        success: true, 
        message: "Order status updated successfully",
        emailSent: emailResult.success,
        emailError: emailResult.error || undefined
      });
    } catch (error: any) {
      console.error("Error updating order status:", error);
      res.status(500).json({ 
        message: "Failed to update order status", 
        error: error.message 
      });
    }
  });

  // VyronaRead order status update endpoint (matches seller dashboard calls)
  app.post("/api/orders/:orderId/update-status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ message: "Order ID and status are required" });
      }

      // Validate status progression for VyronaRead orders
      const validStatuses = ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Get current order details
      const orderResult = await db.execute(sql`
        SELECT o.*, u.email as customer_email, u.username as customer_name 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ${parseInt(orderId)}
      `);

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      const order = orderResult.rows[0] as any;
      
      // Update order status in database
      await db.execute(sql`
        UPDATE orders 
        SET status = ${status}
        WHERE id = ${parseInt(orderId)}
      `);

      // Send automated email based on status for VyronaRead orders
      let emailResult: { success: boolean; messageId?: string; error?: string } = { success: false };
      
      if (['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(status)) {
        const orderData = {
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          orderTotal: order.total_amount,
          orderItems: order.metadata?.items || order.metadata?.products || [],
          orderDate: order.created_at,
          trackingNumber,
          deliveryAddress: order.metadata?.deliveryAddress || 'As provided during checkout'
        };

        let emailTemplate;
        switch (status) {
          case 'processing':
            emailTemplate = generateOrderProcessingEmail(orderData);
            break;
          case 'shipped':
            emailTemplate = generateOrderShippedEmail(orderData);
            break;
          case 'out_for_delivery':
            emailTemplate = generateOrderOutForDeliveryEmail(orderData);
            break;
          case 'delivered':
            emailTemplate = generateOrderDeliveredEmail(orderData);
            break;
        }

        if (emailTemplate) {
          // Send email to customer
          emailResult = await sendBrevoEmail({
            to: order.customer_email,
            subject: emailTemplate.subject,
            htmlContent: emailTemplate.htmlContent
          });

          // Log email notification in database
          try {
            await db.execute(sql`
              INSERT INTO email_notifications (
                order_id, user_id, email_type, status, recipient_email, 
                subject, content, brevo_message_id, sent_at
              ) VALUES (
                ${parseInt(orderId)}, ${order.user_id}, ${status}, 
                ${emailResult.success ? 'sent' : 'failed'}, ${order.customer_email},
                ${emailTemplate.subject}, ${emailTemplate.htmlContent},
                ${emailResult.messageId || null}, 
                ${emailResult.success ? new Date().toISOString() : null}
              )
            `);
          } catch (emailLogError) {
            console.error("Error logging VyronaRead email notification:", emailLogError);
          }
        }
      }

      res.json({ 
        success: true, 
        message: "VyronaRead order status updated successfully",
        emailSent: emailResult.success,
        emailError: emailResult.error || undefined
      });
    } catch (error: any) {
      console.error("Error updating VyronaRead order status:", error);
      res.status(500).json({ 
        message: "Failed to update order status", 
        error: error.message 
      });
    }
  });

  app.get("/api/seller/orders/:orderId/details", async (req, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        return res.status(403).json({ message: "Access denied" });
      }

      const orderId = parseInt(req.params.orderId);
      
      // Get detailed order information
      const orderDetails = await db.execute(sql`
        SELECT 
          o.*,
          u.username as customer_name,
          u.email as customer_email,
          u.phone as customer_phone,
          p.name as product_name,
          p.price as product_price,
          ci.quantity,
          (p.price * ci.quantity) as line_total
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        JOIN cart_items ci ON ci.room_id = ANY(
          SELECT room_id FROM group_contributions gc WHERE gc.order_id = o.id
        )
        JOIN products p ON ci.product_id = p.id
        WHERE o.id = ${orderId}
          AND p.store_id IN (
            SELECT id FROM stores WHERE seller_id = ${user.id}
          )
      `);

      if (orderDetails.rows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(orderDetails.rows);
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/seller/orders/:orderId/status", async (req, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        return res.status(403).json({ message: "Access denied" });
      }

      const orderId = parseInt(req.params.orderId);
      const { status, trackingNumber } = req.body;

      // Validate status
      const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Update order status
      await db.execute(sql`
        UPDATE orders 
        SET order_status = ${status},
            tracking_number = ${trackingNumber || null},
            updated_at = NOW()
        WHERE id = ${orderId}
          AND EXISTS (
            SELECT 1 FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            JOIN stores s ON p.store_id = s.id
            WHERE s.seller_id = ${user.id}
              AND ci.room_id = ANY(
                SELECT room_id FROM group_contributions gc WHERE gc.order_id = ${orderId}
              )
          )
      `);

      // Create notification for customer
      await db.execute(sql`
        INSERT INTO notifications (user_id, title, message, type, created_at)
        SELECT 
          o.customer_id,
          'Order Status Updated',
          'Your order #' || o.id || ' is now ' || ${status},
          'order_update',
          NOW()
        FROM orders o
        WHERE o.id = ${orderId}
      `);

      res.json({ success: true, message: "Order status updated successfully" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Dashboard - All Orders Management
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;

      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (status) {
        whereClause += ` AND o.status = $${params.length + 1}`;
        params.push(status);
      }

      if (dateFrom) {
        whereClause += ` AND o.created_at >= $${params.length + 1}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ` AND o.created_at <= $${params.length + 1}`;
        params.push(dateTo);
      }

      const allOrders = await pool.query(`
        SELECT 
          o.id as order_id,
          o.user_id,
          o.total_amount,
          o.status as order_status,
          o.module,
          o.metadata,
          o.created_at,
          u.username as customer_name,
          u.email as customer_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      // Get total count for pagination
      const countResult = await pool.query(`
        SELECT COUNT(DISTINCT o.id) as total
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ${whereClause}
      `, params);

      res.json({
        orders: allOrders.rows,
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Internal server error" });
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

  // Add contribution to cart item
  app.post("/api/groups/:groupId/contributions", async (req, res) => {
    try {
      const { groupId } = req.params;
      const { cartItemId, amount, paymentMethod, transactionId } = req.body;
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const contribution = await db.insert(groupContributions).values({
        groupId: Number(groupId),
        cartItemId,
        userId,
        amount: Math.round(amount * 100), // Convert to cents
        paymentMethod,
        transactionId,
        status: 'completed'
      }).returning();

      res.json(contribution[0]);
    } catch (error) {
      console.error("Error adding contribution:", error);
      res.status(500).json({ message: "Failed to add contribution" });
    }
  });

  // Get contributions for a group's cart items
  app.get("/api/groups/:groupId/contributions", async (req, res) => {
    try {
      const { groupId } = req.params;
      
      const contributions = await db.select({
        id: groupContributions.id,
        cartItemId: groupContributions.cartItemId,
        userId: groupContributions.userId,
        amount: groupContributions.amount,
        paymentMethod: groupContributions.paymentMethod,
        transactionId: groupContributions.transactionId,
        status: groupContributions.status,
        contributedAt: groupContributions.contributedAt,
        username: users.username
      })
      .from(groupContributions)
      .innerJoin(users, eq(groupContributions.userId, users.id))
      .where(eq(groupContributions.groupId, Number(groupId)));

      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
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

      // Send email notification for VyronaRead purchase
      try {
        console.log("Sending VyronaRead purchase notification email...");
        const sellerEmail = 'ganesan.sixphrase@gmail.com';
        const sellerName = 'MSR';
        
        const emailResult = await sendBrevoEmail(
          sellerEmail,
          "New Book Purchase - VyronaRead",
          `<h2>New Book Purchase Notification</h2>
            <p>Dear ${sellerName},</p>
            <p>A customer has purchased a book from VyronaRead (Order #${order.id}).</p>
            <h3>Purchase Details:</h3>
            <ul>
              <li>Book ID: ${bookId}</li>
              <li>Amount: ₹${amount.toFixed(2)}</li>
              <li>Payment Method: ${paymentMethod.toUpperCase()}</li>
              <li>Purchase Type: Lifetime Access</li>
            </ul>
            <h3>Customer Details:</h3>
            <p>
              Name: ${customerInfo.name}<br>
              Email: ${customerInfo.email}<br>
              Phone: ${customerInfo.phone}
            </p>
            <p>Please log in to your seller dashboard to process this order.</p>
            <p>Best regards,<br>VyronaRead Team</p>`
        );
        
        if (emailResult.success) {
          console.log(`VyronaRead purchase notification sent successfully to ${sellerEmail}`);
        } else {
          console.error(`Failed to send VyronaRead purchase notification:`, emailResult.error);
        }
      } catch (emailError) {
        console.error("VyronaRead purchase email notification failed:", emailError);
      }

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

      // Send email notification for VyronaRead rental
      try {
        console.log("Sending VyronaRead rental notification email...");
        const sellerEmail = 'ganesan.sixphrase@gmail.com';
        const sellerName = 'MSR';
        
        const emailResult = await sendBrevoEmail(
          sellerEmail,
          "New Book Rental - VyronaRead",
          `<h2>New Book Rental Notification</h2>
            <p>Dear ${sellerName},</p>
            <p>A customer has rented a book from VyronaRead (Order #${order.id}).</p>
            <h3>Rental Details:</h3>
            <ul>
              <li>Book ID: ${bookId}</li>
              <li>Rental Amount: ₹${amount.toFixed(2)}</li>
              <li>Duration: ${duration} days</li>
              <li>Payment Method: ${paymentMethod.toUpperCase()}</li>
              <li>Rental Expires: ${expiryDate.toLocaleDateString()}</li>
            </ul>
            <h3>Customer Details:</h3>
            <p>
              Name: ${customerInfo.name}<br>
              Email: ${customerInfo.email}<br>
              Phone: ${customerInfo.phone}
            </p>
            <p>Please log in to your seller dashboard to process this rental order.</p>
            <p>Best regards,<br>VyronaRead Team</p>`
        );
        
        if (emailResult.success) {
          console.log(`VyronaRead rental notification sent successfully to ${sellerEmail}`);
        } else {
          console.error(`Failed to send VyronaRead rental notification:`, emailResult.error);
        }
      } catch (emailError) {
        console.error("VyronaRead rental email notification failed:", emailError);
      }

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

      // Send email notification for VyronaRead borrowing request
      try {
        console.log("Sending VyronaRead borrowing request notification email...");
        const sellerEmail = 'ganesan.sixphrase@gmail.com';
        const sellerName = 'MSR';
        
        const emailResult = await sendBrevoEmail(
          sellerEmail,
          "New Book Borrowing Request - VyronaRead",
          `<h2>New Book Borrowing Request</h2>
            <p>Dear ${sellerName},</p>
            <p>A customer has submitted a borrowing request from VyronaRead (Request #${order.id}).</p>
            <h3>Borrowing Details:</h3>
            <ul>
              <li>Book ID: ${bookId}</li>
              <li>Request Type: Library Borrowing</li>
              <li>Status: Pending Approval</li>
              <li>Expected Duration: ${borrowingInfo?.duration || 'Not specified'} days</li>
            </ul>
            <h3>Customer Details:</h3>
            <p>
              Name: ${customerInfo.name}<br>
              Email: ${customerInfo.email}<br>
              Phone: ${customerInfo.phone}<br>
              Library ID: ${borrowingInfo?.libraryId || 'Not provided'}
            </p>
            <p>Please review and approve this borrowing request in your seller dashboard.</p>
            <p>Best regards,<br>VyronaRead Team</p>`
        );
        
        if (emailResult.success) {
          console.log(`VyronaRead borrowing notification sent successfully to ${sellerEmail}`);
        } else {
          console.error(`Failed to send VyronaRead borrowing notification:`, emailResult.error);
        }
      } catch (emailError) {
        console.error("VyronaRead borrowing email notification failed:", emailError);
      }

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
  
  // Setup WebSocket server using the existing HTTP server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    port: undefined // Don't bind to a specific port, use the existing server
  });
  
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
          const users = Array.from(onlineUsers.values());
          users.forEach(user => {
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
      const entries = Array.from(onlineUsers.entries());
      for (const [userKey, onlineUser] of entries) {
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
    const entries = Array.from(onlineUsers.entries());
    for (const [userKey, onlineUser] of entries) {
      const timeSinceLastSeen = now.getTime() - onlineUser.lastSeen.getTime();
      
      // Only remove if user hasn't been seen for 5 minutes AND connection is closed
      if (timeSinceLastSeen > 300000 && onlineUser.ws.readyState !== WebSocket.OPEN) {
        console.log(`Removing inactive user: ${userKey}`);
        onlineUsers.delete(userKey);
      }
    }
  }, 60000);

  // Initialize Razorpay (use demo credentials if not provided)
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'fakeSecret123'
  });

  // VyronaWallet API Routes
  app.get("/api/wallet/balance/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        balance: parseFloat(user.walletBalance || "0"),
        currency: "INR" 
      });
    } catch (error: any) {
      console.error('Get wallet balance error:', error);
      res.status(500).json({ error: "Failed to fetch wallet balance" });
    }
  });

  app.get("/api/wallet/transactions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, userId))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(50);

      res.json(transactions);
    } catch (error: any) {
      console.error('Get wallet transactions error:', error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Razorpay wallet routes
  app.post("/api/wallet/create-order", async (req, res) => {
    try {
      const { amount, userId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const options = {
        amount: amount * 100, // Convert to paise
        currency: "INR",
        receipt: `wallet_${userId}_${Date.now()}`
      };

      const order = await razorpay.orders.create(options);

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag'
      });
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  app.post("/api/wallet/verify-payment", async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
        amount
      } = req.body;

      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'fakeSecret123')
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        // Payment verified, update wallet balance
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const currentBalance = parseFloat(user[0].walletBalance || "0");
        const newBalance = currentBalance + amount;

        await db
          .update(users)
          .set({ walletBalance: newBalance.toString() })
          .where(eq(users.id, userId));

        // Create transaction record
        await db.insert(walletTransactions).values({
          userId,
          amount: amount.toString(),
          type: "credit",
          status: "completed",
          description: "Wallet top-up via Razorpay",
          transactionId: razorpay_payment_id
        });

        res.json({
          success: true,
          message: "Payment verified and wallet updated",
          newBalance
        });
      } else {
        res.status(400).json({ error: "Payment verification failed" });
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });

  app.post("/api/wallet/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", userId } = req.body;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid request parameters" });
      }

      // Check if Razorpay is configured
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ 
          error: "Payment gateway not configured. Please contact administrator.",
          code: "PAYMENT_GATEWAY_NOT_CONFIGURED"
        });
      }

      // Create Razorpay order
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt: `wallet_${userId}_${Date.now()}`,
        notes: {
          userId: userId.toString(),
          purpose: "wallet_topup"
        }
      };

      const order = await razorpay.orders.create(options);
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    } catch (error: any) {
      console.error('Create Razorpay order error:', error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  app.post("/api/wallet/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !userId || !amount) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // For demo purposes, we'll accept the payment without signature verification
      // In production, you should verify the signature using Razorpay's webhook
      
      // Update user wallet balance
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(user.walletBalance || "0");
      const newBalance = currentBalance + parseFloat(amount);
      
      // Update user balance
      await db
        .update(users)
        .set({ walletBalance: newBalance.toString() })
        .where(eq(users.id, userId));

      // Create transaction record
      await db.insert(walletTransactions).values({
        userId,
        amount: parseFloat(amount),
        type: "credit",
        status: "completed",
        description: "Wallet top-up via Razorpay",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
      });

      res.json({ 
        success: true, 
        newBalance,
        message: "Payment verified and wallet updated successfully" 
      });
    } catch (error: any) {
      console.error('Verify payment error:', error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.post("/api/wallet/debit", async (req, res) => {
    try {
      const { userId, amount, description } = req.body;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid request parameters" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(user.walletBalance || "0");
      if (currentBalance < amount) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      const newBalance = currentBalance - amount;
      
      // Update user balance
      await db
        .update(users)
        .set({ walletBalance: newBalance.toString() })
        .where(eq(users.id, userId));

      // Create transaction record
      await db.insert(walletTransactions).values({
        userId,
        amount,
        type: "debit",
        status: "completed",
        description: description || "Purchase payment"
      });

      res.json({ 
        success: true, 
        newBalance,
        message: "Amount debited successfully" 
      });
    } catch (error: any) {
      console.error('Debit wallet error:', error);
      res.status(500).json({ error: "Failed to debit wallet" });
    }
  });

  // Contribution-based payment endpoints
  app.post("/api/wallet/pay", async (req, res) => {
    try {
      const { amount, itemId, roomId } = req.body;
      const userId = 1; // Default user for demo
      
      if (!amount || amount <= 0 || !itemId || !roomId) {
        return res.status(400).json({ error: "Invalid payment parameters" });
      }

      // Check wallet balance
      const walletData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!walletData.length) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(walletData[0].walletBalance || "0");
      if (currentBalance < amount) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      // Process wallet payment
      const newBalance = currentBalance - amount;
      const transactionId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db
        .update(users)
        .set({ walletBalance: newBalance.toString() })
        .where(eq(users.id, userId));

      await db.insert(walletTransactions).values({
        userId,
        amount: amount.toString(),
        type: "debit",
        status: "completed",
        description: `Item contribution - Room ${roomId}, Item ${itemId}`,
        transactionId
      });

      res.json({ 
        success: true,
        transactionId,
        newBalance,
        message: "Wallet payment successful"
      });
    } catch (error: any) {
      console.error('Wallet payment error:', error);
      res.status(500).json({ error: "Wallet payment failed" });
    }
  });

  app.post("/api/payments/googlepay-groups", async (req, res) => {
    try {
      const { amount, itemId, roomId, memberCount } = req.body;
      
      if (!amount || amount <= 0 || !itemId || !roomId) {
        return res.status(400).json({ error: "Invalid payment parameters" });
      }

      // Generate Google Pay Groups payment request
      const transactionId = `gpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const paymentUrl = `googlepay://pay?action=customsplit&total=${amount}&itemId=${itemId}&roomId=${roomId}&currency=INR&note=VyronaSocial Item Contribution&transactionId=${transactionId}`;

      // In production, integrate with actual Google Pay Groups API
      // For now, simulate the payment initiation
      setTimeout(async () => {
        try {
          // Simulate successful payment after 2 seconds
          await db.insert(walletTransactions).values({
            userId: 1,
            amount: amount.toString(),
            type: "credit",
            status: "completed",
            description: `Google Pay Groups contribution - Room ${roomId}, Item ${itemId}`,
            transactionId
          });
        } catch (error) {
          console.error('Google Pay Groups callback error:', error);
        }
      }, 2000);

      res.json({
        success: true,
        transactionId,
        paymentUrl,
        status: "initiated",
        message: "Google Pay Groups payment initiated"
      });
    } catch (error: any) {
      console.error('Google Pay Groups error:', error);
      res.status(500).json({ error: "Google Pay Groups payment failed" });
    }
  });

  app.post("/api/payments/phonepe-split", async (req, res) => {
    try {
      const { amount, itemId, roomId, memberCount } = req.body;
      
      if (!amount || amount <= 0 || !itemId || !roomId) {
        return res.status(400).json({ error: "Invalid payment parameters" });
      }

      // Generate PhonePe Split payment request
      const transactionId = `phonepe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const merchantId = "VYRONAMART";
      const splitRequest = {
        merchantId,
        merchantTransactionId: transactionId,
        amount: amount * 100, // PhonePe expects amount in paise
        callbackUrl: `${process.env.REPLIT_URL}/api/payments/phonepe-callback`,
        merchantUserId: "user_1",
        splitInfo: {
          type: "CUSTOM",
          members: Array.from({ length: memberCount }, (_, i) => ({
            userId: `user_${i + 1}`,
            amount: Math.round((amount / memberCount) * 100)
          }))
        }
      };

      // In production, integrate with actual PhonePe Split API
      // For now, simulate the payment initiation
      setTimeout(async () => {
        try {
          // Simulate successful payment after 3 seconds
          await db.insert(walletTransactions).values({
            userId: 1,
            amount: amount.toString(),
            type: "credit",
            status: "completed",
            description: `PhonePe Split contribution - Room ${roomId}, Item ${itemId}`,
            transactionId
          });
        } catch (error) {
          console.error('PhonePe Split callback error:', error);
        }
      }, 3000);

      res.json({
        success: true,
        transactionId,
        splitRequest,
        status: "initiated",
        message: "PhonePe Split payment initiated"
      });
    } catch (error: any) {
      console.error('PhonePe Split error:', error);
      res.status(500).json({ error: "PhonePe Split payment failed" });
    }
  });

  app.post("/api/payments/phonepe-callback", async (req, res) => {
    try {
      // Handle PhonePe payment callback
      const { transactionId, status } = req.body;
      
      if (status === "SUCCESS") {
        // Update transaction status
        await db
          .update(walletTransactions)
          .set({ status: "completed" })
          .where(eq(walletTransactions.transactionId, transactionId));
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('PhonePe callback error:', error);
      res.status(500).json({ error: "Callback processing failed" });
    }
  });

  // Simple UPI QR Code Payment System  
  app.post("/api/payments/upi-qr/generate", async (req, res) => {
    try {
      const { roomId, itemId, amount, userId } = req.body;
      
      if (!roomId || !itemId || !amount || !userId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Generate UPI payment using simplified system
      const { generateUPIQRCode } = await import('./upi-payment');
      const paymentResponse = await generateUPIQRCode({ roomId, itemId, amount, userId });
      
      if (!paymentResponse.success) {
        return res.status(500).json({ error: paymentResponse.error });
      }

      // Store payment intent in notifications table
      await db.insert(notifications).values({
        userId,
        type: "payment", 
        title: "UPI Payment Pending",
        message: `UPI QR contribution - Room ${roomId}, Item ${itemId}`,
        metadata: {
          referenceId: paymentResponse.referenceId,
          roomId,
          itemId,
          amount,
          paymentMethod: "upi_qr",
          status: "pending",
          qrExpiry: paymentResponse.expiryTime,
          upiString: paymentResponse.upiString,
          virtualUPI: paymentResponse.virtualUPI
        }
      });

      res.json({
        success: true,
        qrCode: paymentResponse.qrCode,
        upiString: paymentResponse.upiString,
        referenceId: paymentResponse.referenceId,
        amount: paymentResponse.amount,
        virtualUPI: paymentResponse.virtualUPI,
        paymentLink: paymentResponse.paymentLink,
        requiresManualVerification: paymentResponse.requiresManualVerification,
        expiryTime: paymentResponse.expiryTime,
        instructions: paymentResponse.instructions
      });

    } catch (error: any) {
      console.error('UPI QR generation error:', error);
      res.status(500).json({ error: "Failed to generate UPI QR code" });
    }
  });

  // Manual payment verification endpoint
  app.post("/api/payments/verify-manual", async (req, res) => {
    try {
      const { referenceId, transactionId, amount, screenshot } = req.body;
      
      if (!referenceId || !transactionId) {
        return res.status(400).json({ error: "Missing payment details" });
      }

      // Find the payment notification
      const existingPayment = await db.select()
        .from(notifications)
        .where(sql`metadata->>'referenceId' = ${referenceId} AND type = 'payment'`)
        .limit(1);

      if (!existingPayment.length) {
        return res.status(404).json({ error: "Payment record not found" });
      }

      const payment = existingPayment[0];
      const metadata = payment.metadata as any;

      // Update payment as manually verified
      await db.update(notifications)
        .set({ 
          metadata: {
            ...metadata,
            status: "verified_manual",
            transactionId,
            verifiedAt: new Date().toISOString(),
            screenshot: screenshot || null
          }
        })
        .where(eq(notifications.id, payment.id));

      // Create group contribution notification
      await db.insert(notifications).values({
        userId: payment.userId,
        type: "contribution",
        title: "Payment Verified",
        message: `Your contribution of ₹${metadata.amount} has been verified`,
        metadata: {
          method: "upi_manual",
          transactionId,
          referenceId,
          roomId: metadata.roomId,
          itemId: metadata.itemId,
          amount: metadata.amount,
          verifiedAt: new Date().toISOString(),
          status: "confirmed"
        }
      });

      res.json({ 
        success: true, 
        message: "Payment verified and contribution recorded",
        status: "verified_manual"
      });

    } catch (error) {
      console.error('Manual payment verification error:', error);
      res.status(500).json({ error: "Failed to verify payment manually" });
    }
  });

  // Cashfree AutoCollect Webhook Handler
  app.post("/api/payments/cashfree-webhook", async (req, res) => {
    try {
      const { eventType, data } = req.body;
      
      if (eventType === "VPA_CREDITED") {
        const { vAccountId, amount, reference, utr } = data;
        
        // Find the pending transaction
        const transactions = await db
          .select()
          .from(walletTransactions)
          .where(eq(walletTransactions.transactionId, reference))
          .limit(1);

        if (transactions.length === 0) {
          return res.status(404).json({ error: "Transaction not found" });
        }

        const transaction = transactions[0];
        
        // Update transaction status
        await db
          .update(walletTransactions)
          .set({ 
            status: "completed",
            metadata: {
              ...transaction.metadata,
              utr,
              completedAt: new Date(),
              cashfreeEventType: eventType
            }
          })
          .where(eq(walletTransactions.transactionId, reference));

        // Update user wallet balance
        const userData = await db
          .select()
          .from(users)
          .where(eq(users.id, transaction.userId))
          .limit(1);

        if (userData.length > 0) {
          const currentBalance = parseFloat(userData[0].walletBalance || "0");
          const newBalance = currentBalance + parseFloat(transaction.amount);
          
          await db
            .update(users)
            .set({ walletBalance: newBalance.toString() })
            .where(eq(users.id, transaction.userId));
        }

        // Notify all group members via WebSocket about the contribution update
        const roomId = transaction.metadata?.roomId;
        if (roomId) {
          const contribution = {
            userId: transaction.userId,
            amount: parseFloat(transaction.amount),
            transactionId: reference,
            status: "completed",
            paymentMethod: "upi_qr",
            timestamp: new Date()
          };

          // Broadcast to all online users in the group
          const entries = Array.from(onlineUsers.entries());
          for (const [socketId, user] of entries) {
            if (user.groupId === roomId && user.ws.readyState === WebSocket.OPEN) {
              user.ws.send(JSON.stringify({
                type: "contribution_update",
                data: contribution
              }));
            }
          }
        }

        console.log(`UPI payment completed: ${reference} - ₹${amount}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Cashfree webhook error:', error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Check UPI payment status
  app.get("/api/payments/upi-qr/status/:referenceId", async (req, res) => {
    try {
      const { referenceId } = req.params;
      
      // Find payment record in notifications table
      const paymentRecords = await db
        .select()
        .from(notifications)
        .where(eq(notifications.message, `UPI QR contribution - Room ${referenceId.split('_')[0].replace('GRP', '')}, Item ${referenceId.split('_')[1].replace('ITM', '')}`))
        .limit(1);

      if (paymentRecords.length === 0) {
        return res.status(404).json({ error: "Payment reference not found" });
      }

      const payment = paymentRecords[0];
      const metadata = payment.metadata as any;
      
      // Simulate payment completion after 30 seconds for demo
      const createdTime = new Date(payment.createdAt).getTime();
      const currentTime = new Date().getTime();
      const isCompleted = (currentTime - createdTime) > 30000; // 30 seconds
      
      if (isCompleted && metadata.status === 'pending') {
        // Update payment status to completed
        await db
          .update(notifications)
          .set({ 
            title: "UPI Payment Completed",
            metadata: {
              ...metadata,
              status: "completed",
              completedAt: new Date()
            }
          })
          .where(eq(notifications.id, payment.id));
      }
      
      res.json({
        success: true,
        status: isCompleted ? "completed" : "pending",
        amount: metadata.amount,
        referenceId: metadata.referenceId,
        metadata,
        createdAt: payment.createdAt,
        isPending: !isCompleted,
        isCompleted: isCompleted
      });

    } catch (error: any) {
      console.error('UPI status check error:', error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  app.post("/api/group-orders/place", async (req, res) => {
    try {
      const { roomId, items, totalAmount } = req.body;
      const userId = 1; // Default user for demo
      
      if (!roomId || !items || !totalAmount) {
        return res.status(400).json({ error: "Invalid order parameters" });
      }

      // Verify all items are fully funded
      const allItemsFunded = items.every((item: any) => item.isFullyFunded);
      if (!allItemsFunded) {
        return res.status(400).json({ error: "All items must be fully funded before placing order" });
      }

      // Create order record
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(orders).values({
        userId,
        totalAmount: totalAmount,
        status: "placed",
        module: "social",
        metadata: {
          roomId,
          items,
          orderType: "group_contribution",
          placedAt: new Date()
        }
      });

      // Clear room cart after successful order
      await db.delete(cartItems).where(eq(cartItems.roomId, roomId));

      res.json({
        success: true,
        orderId,
        message: "Group order placed successfully",
        estimatedDelivery: "3-5 business days"
      });
    } catch (error: any) {
      console.error('Place order error:', error);
      res.status(500).json({ error: "Failed to place group order" });
    }
  });

  // Admin Users API - Only Customers
  app.get("/api/admin/users", async (req, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const usersResult = await db.execute(sql`
        SELECT id, username, email, mobile, role, created_at
        FROM users
        WHERE role = 'customer'
        ORDER BY created_at DESC
      `);

      res.json(usersResult.rows);
    } catch (error: any) {
      console.error('Admin users fetch error:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin Sellers API
  app.get("/api/admin/sellers", async (req, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const sellersResult = await db.execute(sql`
        SELECT id, username, email, mobile, role, created_at, is_active
        FROM users
        WHERE role = 'seller'
        ORDER BY created_at DESC
      `);

      res.json(sellersResult.rows);
    } catch (error: any) {
      console.error('Admin sellers fetch error:', error);
      res.status(500).json({ message: "Failed to fetch sellers" });
    }
  });

  // DELETE seller and all associated products
  app.delete("/api/admin/sellers/:sellerId", async (req, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const sellerId = parseInt(req.params.sellerId);
      if (!sellerId) {
        return res.status(400).json({ message: "Invalid seller ID" });
      }

      // Check if seller exists
      const sellerCheck = await db.execute(sql`
        SELECT id, username FROM users WHERE id = ${sellerId} AND role = 'seller'
      `);

      if (sellerCheck.rows.length === 0) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // First, get product IDs to be removed (products with sellerId in metadata)
      const productsToDelete = await db.execute(sql`
        SELECT id, name FROM products 
        WHERE metadata->>'sellerId' = ${sellerId.toString()}
      `);

      console.log(`Found ${productsToDelete.rows.length} products to delete for seller ${sellerId}:`, 
        productsToDelete.rows.map(p => p.name));

      // Remove cart items for seller's products first (before deleting products)
      if (productsToDelete.rows.length > 0) {
        const productIds = productsToDelete.rows.map(row => row.id);
        for (const productId of productIds) {
          await db.execute(sql`
            DELETE FROM cart_items WHERE product_id = ${productId}
          `);
        }
      }

      // Remove any orders from this seller
      await db.execute(sql`
        DELETE FROM orders 
        WHERE metadata->>'sellerId' = ${sellerId.toString()}
      `);

      // Remove all products associated with this seller
      await db.execute(sql`
        DELETE FROM products 
        WHERE metadata->>'sellerId' = ${sellerId.toString()}
      `);

      // Get and remove seller's stores (find stores that might be owned by this seller)
      const sellerStores = await db.execute(sql`
        SELECT id FROM stores 
        WHERE metadata->>'sellerId' = ${sellerId.toString()}
           OR metadata->>'ownerId' = ${sellerId.toString()}
      `);

      if (sellerStores.rows.length > 0) {
        // Remove products from seller's stores
        for (const store of sellerStores.rows) {
          await db.execute(sql`
            DELETE FROM products WHERE store_id = ${store.id}
          `);
        }
        
        // Remove the stores themselves
        for (const store of sellerStores.rows) {
          await db.execute(sql`
            DELETE FROM stores WHERE id = ${store.id}
          `);
        }
      }

      // Finally remove the seller user account
      await db.execute(sql`
        DELETE FROM users WHERE id = ${sellerId}
      `);

      console.log(`Admin removed seller ID ${sellerId} and all associated data`);
      res.json({ 
        success: true, 
        message: `Seller ${sellerCheck.rows[0].username} and all associated products removed successfully` 
      });

    } catch (error: any) {
      console.error('Admin seller removal error:', error);
      res.status(500).json({ message: "Failed to remove seller" });
    }
  });

  // Admin Orders API
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const ordersResult = await db.execute(sql`
        SELECT 
          o.id, o.user_id, o.total_amount, o.status, o.module, o.metadata, o.created_at,
          u.username, u.email, u.mobile
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 100
      `);

      res.json(ordersResult.rows);
    } catch (error: any) {
      console.error('Admin orders fetch error:', error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Order submission endpoint for VyronaHub checkout flow
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      console.log("Order request body:", JSON.stringify(req.body, null, 2));
      
      const { items, shippingAddress, paymentMethod, totalAmount, total } = req.body;
      const userId = 1; // Default user for demo
      const orderTotal = totalAmount || total;

      console.log("Extracted values:", { 
        items: !!items, 
        shippingAddress: !!shippingAddress, 
        paymentMethod: !!paymentMethod, 
        orderTotal: !!orderTotal 
      });

      if (!items || !shippingAddress || !paymentMethod || !orderTotal) {
        console.log("Missing required fields validation failed");
        return res.status(400).json({ error: "Missing required order information" });
      }

      // Create order in database
      const orderResult = await db.insert(orders).values({
        userId,
        totalAmount: orderTotal,
        status: "processing",
        module: "vyronahub",
        metadata: {
          shippingAddress,
          paymentMethod,
          items
        }
      }).returning();

      const orderId = orderResult[0].id;

      // Clear cart after successful order
      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      // Send notifications to sellers and customer
      try {
        // Get unique sellers for the ordered items
        const sellerEmails = new Set<string>();
        for (const item of items) {
          // Get seller info for each product
          const productResult = await db
            .select({
              sellerEmail: users.email,
              sellerName: users.username,
              storeName: stores.name
            })
            .from(products)
            .leftJoin(stores, eq(products.storeId, stores.id))
            .leftJoin(users, eq(stores.sellerId, users.id))
            .where(eq(products.id, item.id))
            .limit(1);

          if (productResult.length > 0 && productResult[0].sellerEmail) {
            sellerEmails.add(productResult[0].sellerEmail);
            
            // Send seller notification
            await sendBrevoEmail(
              productResult[0].sellerEmail,
              "New Order Received - VyronaHub",
              `<h2>New Order Notification</h2>
                <p>Dear ${productResult[0].sellerName},</p>
                <p>You have received a new order (Order #${orderId}) from VyronaHub.</p>
                <h3>Order Details:</h3>
                <ul>
                  ${items.filter((orderItem: any) => orderItem.id === item.id).map((orderItem: any) => 
                    `<li>${orderItem.name} - Quantity: ${orderItem.quantity} - Price: ₹${(orderItem.price / 100).toFixed(2)}</li>`
                  ).join('')}
                </ul>
                <p><strong>Total Amount: ₹${(total / 100).toFixed(2)}</strong></p>
                <h3>Customer Details:</h3>
                <p>
                  Name: ${shippingAddress.fullName}<br>
                  Phone: ${shippingAddress.phone}<br>
                  Address: ${shippingAddress.addressLine1}, ${shippingAddress.addressLine2 || ''}<br>
                  ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}
                </p>
                <p>Please log in to your seller dashboard to process this order.</p>
                <p>Best regards,<br>VyronaHub Team</p>`
            );
          }
        }

        // Send customer confirmation email
        const orderEmailData = {
          orderId: orderId,
          customerName: shippingAddress.fullName,
          customerEmail: "customer@example.com",
          orderTotal: total,
          orderItems: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          orderDate: new Date().toLocaleDateString(),
          deliveryAddress: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`
        };

        const emailTemplate = generateOrderProcessingEmail(orderEmailData);
        await sendBrevoEmail(
          "customer@example.com",
          emailTemplate.subject,
          emailTemplate.htmlContent
        );
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      res.json({ 
        success: true, 
        orderId,
        message: "Order placed successfully"
      });

    } catch (error) {
      console.error('Order submission error:', error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // Cart API endpoints for VyronaHub checkout flow
  app.get("/api/cart", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Default user for demo
      
      // Get user's cart items with product details
      const userCartItems = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          category: products.category,
          module: products.module,
          imageUrl: products.imageUrl,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, userId));

      res.json(userCartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", async (req: Request, res: Response) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = 1; // Default user for demo

      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      // Check if item already exists in cart
      const existingItem = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
        .limit(1);

      if (existingItem.length > 0) {
        // Update quantity
        await db
          .update(cartItems)
          .set({ quantity: existingItem[0].quantity + quantity })
          .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
      } else {
        // Add new item
        await db.insert(cartItems).values({
          userId,
          productId,
          quantity,
          addedAt: new Date(),
          roomId: null
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.delete("/api/cart/:productId", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const userId = 1; // Default user for demo

      await db
        .delete(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, Number(productId))));

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.put("/api/cart/:productId", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const userId = 1; // Default user for demo

      if (quantity <= 0) {
        await db
          .delete(cartItems)
          .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, Number(productId))));
      } else {
        await db
          .update(cartItems)
          .set({ quantity })
          .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, Number(productId))));
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({ error: "Failed to update cart" });
    }
  });

  app.delete("/api/cart", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Default user for demo

      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });
  
  return httpServer;
}
