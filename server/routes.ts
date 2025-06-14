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
  generateOrderDeliveredEmail,
  generateInstagramSellerNotificationEmail,
  generateInstagramCustomerConfirmationEmail,
  generateInstagramOrderStatusEmail
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
  walletTransactions, users, orders, groupContributions, notifications, products, cartItems, stores,
  physicalBooks, eBooks, instagramProducts, instagramStores, instagramOrders, bookLoans
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { shoppingGroups, groupMembers } from "../migrations/schema";
import { z } from "zod";
import { sendOTPEmail, sendOrderConfirmationEmail } from "./email";

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
  
  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));
  
  // Seller registration endpoint
  app.post("/api/seller-registration", async (req, res) => {
    try {
      const formData = req.body;
      console.log("Seller registration request:", formData);
      
      // Basic validation
      if (!formData.businessName || !formData.ownerName || !formData.email || !formData.phone) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Store seller application (for now, just log it)
      // In production, this would save to a sellers table
      console.log("New seller application:", {
        sellerType: formData.sellerType,
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        category: formData.businessCategory,
        submittedAt: new Date()
      });
      
      // Send confirmation email (if email service is configured)
      try {
        await sendOTPEmail(formData.email, "Thank you for your seller application! We'll review it within 2-3 business days.");
      } catch (emailError) {
        console.log("Email sending failed (expected in demo):", emailError);
      }
      
      res.json({ 
        success: true, 
        message: "Application submitted successfully",
        applicationId: `APP${Date.now()}`
      });
      
    } catch (error) {
      console.error("Seller registration error:", error);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });
  
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
        const sellerNotifications = new Map<string, { 
          sellerInfo: any, 
          orderItems: any[], 
          totalAmount: number 
        }>();

        console.log("Processing items for email notifications:", items.length);
        
        // Group items by seller
        for (const item of items) {
          try {
            // Get product information to find the seller
            const productResult = await db
              .select()
              .from(products)
              .where(eq(products.id, item.productId))
              .limit(1);
            
            if (productResult.length === 0) {
              console.warn(`Product not found for item: ${item.name} (ID: ${item.productId})`);
              continue;
            }
            
            const product = productResult[0];
            
            // Get seller information
            const sellerResult = await db
              .select()
              .from(users)
              .where(eq(users.id, product.sellerId))
              .limit(1);
            
            if (sellerResult.length === 0) {
              console.warn(`Seller not found for product: ${product.name} (Seller ID: ${product.sellerId})`);
              continue;
            }
            
            const seller = sellerResult[0];
            const sellerKey = `${seller.id}-${seller.email}`;
            
            if (!sellerNotifications.has(sellerKey)) {
              sellerNotifications.set(sellerKey, {
                sellerInfo: seller,
                orderItems: [],
                totalAmount: 0
              });
            }
            
            const notification = sellerNotifications.get(sellerKey)!;
            notification.orderItems.push(item);
            notification.totalAmount += item.price * item.quantity;
            
          } catch (itemError) {
            console.error(`Error processing item ${item.name}:`, itemError);
          }
        }

        // Send notifications to each seller
        for (const [sellerKey, notification] of sellerNotifications) {
          const { sellerInfo, orderItems, totalAmount } = notification;
          
          console.log(`Sending order notification to seller: ${sellerInfo.email} (${sellerInfo.username})`);
          
          const itemsList = orderItems.map((item: any) => 
            `<li>${item.name} - Quantity: ${item.quantity} - Price: ₹${item.price.toFixed(2)}</li>`
          ).join('');
          
          const emailResult = await sendBrevoEmail(
            sellerInfo.email,
            "New Order Received - VyronaHub",
            `<h2>New Order Notification</h2>
              <p>Dear ${sellerInfo.username},</p>
              <p>You have received a new order (Order #${orderId}) from VyronaHub for your products.</p>
              <h3>Your Products in this Order:</h3>
              <ul>${itemsList}</ul>
              <p><strong>Your Revenue from this Order: ₹${totalAmount.toFixed(2)}</strong></p>
              <h3>Customer Details:</h3>
              <p>
                Name: ${shippingAddress.fullName}<br>
                Phone: ${shippingAddress.phoneNumber}<br>
                Address: ${shippingAddress.address}<br>
                ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}
              </p>
              <p>Payment Method: ${paymentMethod.toUpperCase()}</p>
              <p>Please log in to your VyronaHub seller dashboard to process this order.</p>
              <p>Best regards,<br>VyronaHub Team</p>`
          );
          
          if (emailResult.success) {
            console.log(`Seller notification email sent successfully to ${sellerInfo.email}`);
          } else {
            console.error(`Failed to send seller notification email to ${sellerInfo.email}:`, emailResult.error);
          }
        }

        // Send customer confirmation email
        const orderEmailData = {
          orderId: orderId,
          customerName: shippingAddress.fullName,
          customerEmail: shippingAddress.email,
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
          shippingAddress.email,
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
      

      
      // Check admin credentials
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
        // Use seller type from database for sellers, fallback to vyronahub if not set
        let sellerType;
        if (user.role === 'seller') {
          sellerType = user.sellerType || 'vyronahub';
        }

        req.session.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role as 'customer' | 'seller' | 'admin',
          sellerType
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

  // Get individual e-book by ID for checkout
  app.get("/api/vyronaread/ebooks/:id", async (req, res) => {
    try {
      const ebookId = parseInt(req.params.id);
      if (isNaN(ebookId)) {
        return res.status(400).json({ message: "Invalid e-book ID" });
      }
      
      const ebook = await storage.getEbook(ebookId);
      if (!ebook) {
        return res.status(404).json({ message: "E-book not found" });
      }
      
      res.json(ebook);
    } catch (error) {
      console.error("Error fetching e-book:", error);
      res.status(500).json({ message: "Failed to fetch e-book" });
    }
  });

  // E-book purchase endpoint with email notifications
  app.post("/api/vyronaread/ebook-purchase", async (req, res) => {
    try {
      const { ebookId, customerInfo, transactionType, paymentMethod, duration } = req.body;
      
      if (!ebookId || !customerInfo || !transactionType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get e-book details
      const ebook = await storage.getEbook(parseInt(ebookId));
      if (!ebook) {
        return res.status(404).json({ message: "E-book not found" });
      }

      // Calculate amount based on transaction type
      const amount = transactionType === 'buy' 
        ? ebook.salePrice / 100 
        : ebook.rentalPrice / 100;

      // Calculate rental expiry if applicable
      let expiryDate = null;
      if (transactionType === 'rent' && duration) {
        const currentDate = new Date();
        expiryDate = new Date(currentDate.getTime() + (duration * 24 * 60 * 60 * 1000));
      }

      // Create order record
      const order = await storage.createOrder({
        userId: 1, // Default user for now
        totalAmount: amount,
        status: "completed",
        module: "vyronaread",
        metadata: {
          type: "ebook_purchase",
          ebookId: parseInt(ebookId),
          ebookTitle: ebook.title,
          ebookAuthor: ebook.author,
          customerInfo,
          paymentMethod,
          transactionType,
          accessType: transactionType === 'buy' ? 'lifetime' : 'temporary',
          duration: duration || null,
          rentalExpiry: expiryDate ? expiryDate.toISOString() : null
        }
      });

      // Send seller notification email
      try {
        const { sendBrevoEmail } = await import('./brevo-email');
        const sellerEmail = 'ganesan.sixphrase@gmail.com';
        const sellerName = 'MSR';
        
        const emailResult = await sendBrevoEmail(
          sellerEmail,
          `New E-book ${transactionType === 'buy' ? 'Purchase' : 'Rental'} - VyronaRead`,
          `<h2>New E-book ${transactionType === 'buy' ? 'Purchase' : 'Rental'} Notification</h2>
            <p>Dear ${sellerName},</p>
            <p>A customer has ${transactionType === 'buy' ? 'purchased' : 'rented'} an e-book from VyronaRead (Order #${order.id}).</p>
            <h3>E-book Details:</h3>
            <ul>
              <li>Title: ${ebook.title}</li>
              <li>Author: ${ebook.author}</li>
              <li>ISBN: ${ebook.isbn}</li>
              <li>Amount: ₹${amount.toFixed(2)}</li>
              <li>Transaction Type: ${transactionType === 'buy' ? 'Purchase (Lifetime Access)' : `Rental (${duration} days)`}</li>
              <li>Payment Method: ${paymentMethod.toUpperCase()}</li>
              ${transactionType === 'rent' ? `<li>Rental Expires: ${expiryDate?.toLocaleDateString()}</li>` : ''}
            </ul>
            <h3>Customer Details:</h3>
            <p>
              Name: ${customerInfo.name}<br>
              Email: ${customerInfo.email}<br>
              Phone: ${customerInfo.phone}
            </p>
            <p>Please log in to your VyronaRead seller dashboard to view this transaction.</p>
            <p>Best regards,<br>VyronaRead Team</p>`
        );
        
        if (emailResult.success) {
          console.log(`E-book ${transactionType} notification sent successfully to ${sellerEmail}`);
        } else {
          console.error(`Failed to send e-book ${transactionType} notification:`, emailResult.error);
        }
      } catch (emailError) {
        console.error("E-book seller email notification failed:", emailError);
      }

      // Send customer confirmation email
      try {
        const { sendBrevoEmail } = await import('./brevo-email');
        
        const customerEmailResult = await sendBrevoEmail(
          customerInfo.email,
          `E-book ${transactionType === 'buy' ? 'Purchase' : 'Rental'} Confirmation - VyronaRead`,
          `<h2>Your e-book ${transactionType === 'buy' ? 'purchase' : 'rental'} is confirmed!</h2>
            <p>Dear ${customerInfo.name},</p>
            <p>Thank you for your e-book ${transactionType === 'buy' ? 'purchase' : 'rental'} (Order #${order.id}).</p>
            <h3>E-book Details:</h3>
            <ul>
              <li>Title: ${ebook.title}</li>
              <li>Author: ${ebook.author}</li>
              <li>Format: ${ebook.format}</li>
              <li>Amount Paid: ₹${amount.toFixed(2)}</li>
              <li>Payment Method: ${paymentMethod.toUpperCase()}</li>
              <li>Access Type: ${transactionType === 'buy' ? 'Lifetime Access' : `${duration} days rental`}</li>
              ${transactionType === 'rent' ? `<li>Access Expires: ${expiryDate?.toLocaleDateString()}</li>` : ''}
            </ul>
            <p>You can now access your e-book from your VyronaRead account${transactionType === 'rent' ? ' until the expiry date' : ''}.</p>
            <p>Start reading immediately or download for offline access.</p>
            <p>Thank you for choosing VyronaRead!</p>
            <p>Best regards,<br>VyronaRead Team</p>`
        );
        
        if (customerEmailResult.success) {
          console.log(`Customer e-book ${transactionType} confirmation sent to ${customerInfo.email}`);
        }
      } catch (customerEmailError) {
        console.error("Customer e-book confirmation email failed:", customerEmailError);
      }

      res.json({
        success: true,
        orderId: order.id,
        message: `E-book ${transactionType === 'buy' ? 'purchased' : 'rented'} successfully`,
        accessType: transactionType === 'buy' ? 'lifetime' : 'temporary',
        expiryDate: expiryDate ? expiryDate.toISOString() : null
      });
    } catch (error) {
      console.error("E-book purchase error:", error);
      res.status(500).json({ message: "Failed to process e-book transaction" });
    }
  });

  app.get("/api/vyronaread/seller-books", async (req, res) => {
    try {
      const sellerId = req.query.sellerId;
      if (sellerId) {
        const sellerBooks = await storage.getPhysicalBooksBySeller(parseInt(sellerId as string));
        // Filter out library integration books (books with libraryId)
        const onlySellerBooks = sellerBooks.filter(book => !book.libraryId);
        res.json(onlySellerBooks);
      } else {
        const physicalBooks = await storage.getAllPhysicalBooks();
        // Only return books added via seller dashboard (no libraryId)
        const onlySellerBooks = physicalBooks.filter(book => !book.libraryId);
        res.json(onlySellerBooks);
      }
    } catch (error) {
      console.error("Error fetching seller books:", error);
      res.status(500).json({ message: "Failed to fetch seller books" });
    }
  });

  app.get("/api/vyronaread/library-books", async (req, res) => {
    try {
      const allBooks = await storage.getAllPhysicalBooks();
      // Only return library integration books (books with libraryId)
      const libraryBooks = allBooks.filter(book => book.libraryId);
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

  // Seller-specific products route for data isolation
  app.get("/api/seller/products", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (authenticatedUser.role !== 'seller' && authenticatedUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Seller role required." });
      }
      
      // Get products for the authenticated seller only
      const products = await storage.getProductsBySeller(authenticatedUser.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching seller products:", error);
      res.status(500).json({ message: "Failed to fetch seller products" });
    }
  });

  // VyronaRead-specific products route for VyronaRead sellers
  app.get("/api/vyronaread/seller-books", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronaread') {
        return res.status(403).json({ message: "Access denied. VyronaRead seller access required." });
      }
      
      // Get only VyronaRead books for this seller
      const products = await storage.getProducts('vyronaread', 'books');
      const sellerBooks = products.filter(product => 
        product.metadata?.sellerId === authenticatedUser.id
      );
      
      res.json(sellerBooks);
    } catch (error) {
      console.error("Error fetching VyronaRead seller books:", error);
      res.status(500).json({ message: "Failed to fetch VyronaRead books" });
    }
  });

  // Product routes - VyronaHub (individual buy enabled products, excluding VyronaRead)
  app.get("/api/products", async (req, res) => {
    try {
      const { module, category } = req.query;
      
      // If specifically requesting VyronaRead products, return them directly
      if (module === 'vyronaread') {
        const vyronareadProducts = await storage.getProducts('vyronaread', category as string);
        return res.json(vyronareadProducts);
      }
      
      const products = await storage.getProducts(
        module as string,
        category as string
      );
      
      // Filter out VyronaRead products for VyronaHub interface
      // Only show products that are NOT vyronaread module
      const hubProducts = products.filter(product => 
        product.enableIndividualBuy !== false && 
        product.module !== 'vyronaread'
      );
      
      res.json(hubProducts);
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
      // Get authenticated seller ID from session
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Ensure only sellers can create products
      if (authenticatedUser.role !== 'seller' && authenticatedUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Seller role required." });
      }
      
      const sellerId = authenticatedUser.id;
      
      // Add seller ID directly to product data for proper ownership tracking
      const productData = {
        ...req.body,
        sellerId: sellerId, // Direct seller ID assignment for data isolation
        metadata: {
          ...req.body.metadata,
          sellerName: authenticatedUser.username,
          sellerEmail: authenticatedUser.email,
          sellerType: authenticatedUser.sellerType
        }
      };
      
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Delete product endpoint - only sellers can delete their own products
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Ensure only sellers can delete products
      if (authenticatedUser.role !== 'seller' && authenticatedUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Seller role required." });
      }
      
      // Get the product to verify ownership
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if the seller owns this product (unless admin)
      if (authenticatedUser.role !== 'admin') {
        if (product.sellerId !== authenticatedUser.id) {
          return res.status(403).json({ message: "Access denied. You can only delete your own products." });
        }
      }
      
      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
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

  app.delete("/api/cart/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const userId = 1; // Default user for demo
      
      const result = await db
        .delete(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
      
      if ((result.rowCount || 0) === 0) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing cart item:', error);
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
      // This includes both regular orders and library membership requests
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
          'order' as record_type,
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
          OR (${sellerId} = 14 AND o.module IN ('vyronahub', 'vyronaread'))
        )
        
        UNION ALL
        
        SELECT 
          n.id as order_id,
          n.user_id,
          COALESCE((n.metadata->>'membershipFee')::integer * 100, 200000) as total_amount,
          'pending' as order_status,
          'library_membership' as module,
          n.metadata,
          n.created_at,
          COALESCE(n.metadata->>'fullName', 'Library Member') as customer_name,
          COALESCE(n.metadata->>'email', 'N/A') as customer_email,
          COALESCE(n.metadata->>'phone', 'N/A') as customer_phone,
          'membership' as record_type,
          NULL as shipping_address,
          'Library Membership Payment' as payment_method,
          NULL as order_items
        FROM notifications n
        LEFT JOIN library_integration_requests l ON l.id = n.user_id
        WHERE n.type = 'library_membership_request'
          AND n.metadata->>'fullName' IS NOT NULL
          AND (l.seller_id = ${sellerId} OR ${authenticatedUser.role === 'admin'})
        
        ORDER BY created_at DESC
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

        // Handle library membership orders
        if (order.module === 'library_membership') {
          const metadata = order.metadata;
          return {
            ...order,
            shipping_address: null,
            order_items: [],
            formatted_total: `₹${(order.total_amount / 100).toFixed(2)}`,
            formatted_date: new Date(order.created_at).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            // Library-specific details
            library_details: {
              bookTitle: metadata?.bookTitle || 'Library Access',
              membershipType: metadata?.membershipType || 'annual',
              customerAddress: metadata?.address || 'Not provided',
              bookId: metadata?.bookId
            }
          };
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

      // Check if this is a library membership order (stored in notifications) or regular order
      let order: any = null;
      let isLibraryMembership = false;
      
      // First try to find in regular orders table
      const orderResult = await db.execute(sql`
        SELECT o.*, u.email as customer_email, u.username as customer_name 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ${parseInt(orderId)}
      `);

      if (orderResult.rows.length > 0) {
        order = orderResult.rows[0] as any;
      } else {
        // Try to find in notifications table (library membership)
        const notificationResult = await db.execute(sql`
          SELECT n.*, n.metadata->>'email' as customer_email, n.metadata->>'fullName' as customer_name,
                 'library_membership' as module, n.metadata->>'status' as status
          FROM notifications n
          WHERE n.id = ${parseInt(orderId)} AND n.type = 'library_membership_request'
        `);
        
        if (notificationResult.rows.length > 0) {
          order = {
            ...notificationResult.rows[0],
            total_amount: (notificationResult.rows[0] as any).metadata?.membershipFee * 100 || 200000,
            order_status: (notificationResult.rows[0] as any).metadata?.status || 'pending'
          };
          isLibraryMembership = true;
        }
      }

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Validate status progression (prevent skipping stages)
      const statusProgression = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
      const currentIndex = statusProgression.indexOf(order.status || order.order_status || 'pending');
      const newIndex = statusProgression.indexOf(status);
      
      // Allow updating from pending/null to any valid status, or normal progression
      if (status !== 'cancelled' && currentIndex > 0 && newIndex <= currentIndex) {
        return res.status(400).json({ message: "Cannot go backwards in order status progression" });
      }

      // Update order status (different table based on order type)
      if (isLibraryMembership) {
        // Update notification metadata for library membership
        const updatedMetadata = {
          ...order.metadata,
          status: status
        };
        await db.execute(sql`
          UPDATE notifications 
          SET metadata = ${JSON.stringify(updatedMetadata)}
          WHERE id = ${parseInt(orderId)}
        `);
      } else {
        // Update regular orders table
        await db.execute(sql`
          UPDATE orders 
          SET status = ${status}
          WHERE id = ${parseInt(orderId)}
        `);
      }

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
        
        if (isLibraryMembership) {
          // Library membership specific email templates
          switch (status) {
            case 'processing':
              emailTemplate = {
                subject: `Library Membership Approved - Welcome!`,
                htmlContent: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 28px;">🎉 Membership Approved!</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                      <h2 style="color: #374151;">Dear ${orderData.customerName},</h2>
                      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                        Congratulations! Your library membership application has been approved. 
                        You can now access our extensive collection of books and resources.
                      </p>
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <h3 style="color: #10b981; margin-top: 0;">Membership Details</h3>
                        <p><strong>Membership Fee:</strong> ₹${(orderData.orderTotal / 100).toFixed(2)}</p>
                        <p><strong>Status:</strong> Approved</p>
                        <p><strong>Next Step:</strong> Membership activation in progress</p>
                      </div>
                      <p style="color: #6b7280;">We'll notify you once your membership is fully activated.</p>
                    </div>
                  </div>
                `
              };
              break;
            case 'shipped':
              emailTemplate = {
                subject: `Library Membership Activated - Start Borrowing Books!`,
                htmlContent: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 28px;">📚 Membership Active!</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                      <h2 style="color: #374151;">Dear ${orderData.customerName},</h2>
                      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                        Great news! Your library membership is now active. You can browse and select books 
                        from our catalog for borrowing.
                      </p>
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                        <h3 style="color: #3b82f6; margin-top: 0;">What's Next?</h3>
                        <p>• Browse our online catalog</p>
                        <p>• Select books you want to borrow</p>
                        <p>• Wait for collection notification</p>
                      </div>
                    </div>
                  </div>
                `
              };
              break;
            case 'out_for_delivery':
              emailTemplate = {
                subject: `Books Ready for Collection - Visit Our Library`,
                htmlContent: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 28px;">📖 Books Ready!</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                      <h2 style="color: #374151;">Dear ${orderData.customerName},</h2>
                      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                        Your selected books are ready for collection! Please visit our library at your convenience 
                        to pick up your books.
                      </p>
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <h3 style="color: #f59e0b; margin-top: 0;">Collection Details</h3>
                        <p><strong>Status:</strong> Ready for pickup</p>
                        <p><strong>Note:</strong> Please contact the library for address and timing</p>
                      </div>
                      <p style="color: #6b7280;">Please bring your membership confirmation and ID for verification.</p>
                    </div>
                  </div>
                `
              };
              break;
            case 'delivered':
              emailTemplate = {
                subject: `Books Collected Successfully - Happy Reading!`,
                htmlContent: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 28px;">✅ Books Collected!</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                      <h2 style="color: #374151;">Dear ${orderData.customerName},</h2>
                      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                        Thank you for collecting your books! We hope you enjoy reading them. 
                        Remember to return them by the due date to avoid any late fees.
                      </p>
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <h3 style="color: #10b981; margin-top: 0;">Important Reminders</h3>
                        <p>• Return books by the due date</p>
                        <p>• Take care of the books</p>
                        <p>• Visit us for more book recommendations</p>
                      </div>
                      <p style="color: #6b7280;">Happy reading! We look forward to serving you again.</p>
                    </div>
                  </div>
                `
              };
              break;
          }
        } else {
          // Regular order email templates
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
            emailResult = await sendBrevoEmail(
              order.customer_email,
              emailTemplate.subject,
              emailTemplate.htmlContent
            );
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
      // Get authenticated user ID
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestData = {
        sellerId: userId,
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

  // Recreate library books with corrected genre mapping
  app.post("/api/recreate-library-books/:libraryId", async (req, res) => {
    try {
      const libraryId = parseInt(req.params.libraryId);
      
      // Get the library request data with CSV
      const libraryRequest = await storage.getLibraryIntegrationRequestById(libraryId);
      if (!libraryRequest) {
        return res.status(404).json({ message: "Library not found" });
      }

      // Delete existing books for this library
      await db.execute(sql`DELETE FROM physical_books WHERE library_id = ${libraryId}`);
      
      // Recreate books with corrected mapping
      await storage.createLibraryBooks(libraryId, libraryRequest);
      
      res.json({ message: "Library books recreated successfully" });
    } catch (error) {
      console.error("Error recreating library books:", error);
      res.status(500).json({ message: "Failed to recreate library books" });
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

  // Get Library Integration Requests for seller
  app.get("/api/library-integration-requests", async (req, res) => {
    try {
      const requests = await storage.getLibraryIntegrationRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching library requests:", error);
      res.status(500).json({ message: "Failed to fetch library requests" });
    }
  });

  // Get books for a specific library
  app.get("/api/vyronaread/library-books/:libraryId", async (req, res) => {
    try {
      const libraryId = parseInt(req.params.libraryId);
      const books = await storage.getPhysicalBooks(libraryId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching library books:", error);
      res.status(500).json({ message: "Failed to fetch library books" });
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
      // Get authenticated user ID
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const updatedRequest = await storage.updateLibraryIntegrationRequestStatus(
        parseInt(id),
        status,
        userId, // Use authenticated user ID
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

  // Product image upload endpoint
  app.post("/api/upload/product-image", upload.single('image'), async (req, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Create image URL from uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error("Product image upload error:", error);
      res.status(500).json({ error: "Failed to upload product image" });
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
        rentalPricePerCycle: Math.round(rentalPricePerCycle), // Store as direct rupees
        totalAmountPaid: Math.round(rentalPricePerCycle), // First cycle payment
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
        amount: Math.round(rentalPricePerCycle),
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

  // VyronaInstaStore API Endpoints
  
  // Get Instagram store for authenticated VyronaInstaStore seller
  app.get("/api/vyronainstastore/store", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const store = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      res.json(store);
    } catch (error) {
      console.error("Error fetching Instagram store:", error);
      res.status(500).json({ message: "Failed to fetch Instagram store" });
    }
  });

  // Connect Instagram store with multiple import methods
  app.post("/api/vyronainstastore/connect", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const { instagramUsername, accessToken, storeName, storeDescription, demoMode } = req.body;

      if (!instagramUsername || !storeName) {
        return res.status(400).json({ 
          message: "Instagram username and store name are required" 
        });
      }

      let syncedProducts = 0;
      let storeData;

      if (demoMode || !accessToken) {
        // Create store without API integration - manual mode
        storeData = {
          userId: authenticatedUser.id,
          instagramUsername: instagramUsername.replace('@', ''),
          instagramUserId: null,
          accessToken: null,
          storeName,
          storeDescription,
          profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=e1306c&color=fff&size=200`,
          followersCount: demoMode ? Math.floor(Math.random() * 10000) + 1000 : 0,
          isActive: true,
          connectedAt: new Date(),
          lastSyncAt: new Date()
        };

        const store = await storage.createInstagramStore(storeData);

        if (demoMode) {
          // Create sample products for demo mode
          const demoProducts = [
            {
              storeId: store.id,
              instagramMediaId: `demo_${Date.now()}_1`,
              productName: "Handcrafted Leather Bag",
              description: "Premium quality handcrafted leather bag perfect for everyday use",
              price: 8999, // $89.99 in cents
              categoryTag: "accessories",
              hashtags: ["handmade", "leather", "fashion", "accessories"],
              productUrl: `https://instagram.com/p/demo1`,
              imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
              isAvailable: true,
            },
            {
              storeId: store.id,
              instagramMediaId: `demo_${Date.now()}_2`,
              productName: "Vintage Sunglasses",
              description: "Classic vintage-style sunglasses with UV protection",
              price: 4550, // $45.50 in cents
              categoryTag: "accessories",
              hashtags: ["vintage", "sunglasses", "fashion", "style"],
              productUrl: `https://instagram.com/p/demo2`,
              imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
              isAvailable: true,
            },
            {
              storeId: store.id,
              instagramMediaId: `demo_${Date.now()}_3`,
              productName: "Artisan Coffee Blend",
              description: "Freshly roasted premium coffee beans from local farms",
              price: 2499, // $24.99 in cents
              categoryTag: "food",
              hashtags: ["coffee", "artisan", "organic", "local"],
              productUrl: `https://instagram.com/p/demo3`,
              imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop",
              isAvailable: true,
            },
            {
              storeId: store.id,
              instagramMediaId: `demo_${Date.now()}_4`,
              productName: "Minimalist Watch",
              description: "Elegant minimalist watch with leather strap",
              price: 12900, // $129.00 in cents
              categoryTag: "accessories",
              hashtags: ["minimalist", "watch", "elegant", "accessories"],
              productUrl: `https://instagram.com/p/demo4`,
              imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
              isAvailable: true,
            },
            {
              storeId: store.id,
              instagramMediaId: `demo_${Date.now()}_5`,
              productName: "Organic Skincare Set",
              description: "Natural organic skincare products for daily routine",
              price: 6775, // $67.75 in cents
              categoryTag: "beauty",
              hashtags: ["organic", "skincare", "natural", "beauty"],
              productUrl: `https://instagram.com/p/demo5`,
              imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
              isAvailable: true,
            }
          ];

          for (const productData of demoProducts) {
            await storage.createInstagramProduct(productData);
            syncedProducts++;
          }
        }

        res.json({ 
          success: true, 
          store: {
            ...store,
            productCount: syncedProducts
          },
          syncedProducts,
          demoMode: demoMode || false,
          message: demoMode 
            ? `Demo store created successfully! You can now add products manually or use the bulk import features. ${syncedProducts} sample products added.`
            : "Store created successfully! You can now add products manually using the dashboard or bulk import features."
        });

      } else {
        // Real Instagram API integration
        try {
          const { instagramAPI } = await import('./instagram-api');

          const businessAccount = await instagramAPI.getBusinessAccount(accessToken);
          const mediaPosts = await instagramAPI.getMediaPosts(accessToken, 50);
          const extractedProducts = instagramAPI.extractProductsFromMedia(mediaPosts);
          const catalogProducts = await instagramAPI.getProductCatalog(accessToken, businessAccount.id);

          storeData = {
            userId: authenticatedUser.id,
            instagramUsername: businessAccount.username,
            instagramUserId: businessAccount.id,
            accessToken,
            storeName: storeName || businessAccount.name,
            storeDescription: storeDescription || businessAccount.biography,
            profilePictureUrl: businessAccount.profile_picture_url,
            followersCount: businessAccount.followers_count,
            isActive: true,
            connectedAt: new Date(),
            lastSyncAt: new Date()
          };

          const store = await storage.createInstagramStore(storeData);

          // Sync products from both sources
          const allProducts = [...catalogProducts, ...extractedProducts];

          for (const product of allProducts) {
            try {
              const productData = instagramAPI.convertToOurProductFormat(product, store.id);
              await storage.createInstagramProduct(productData);
              syncedProducts++;
            } catch (productError) {
              console.error("Error syncing individual product:", productError);
            }
          }

          res.json({ 
            success: true, 
            store: {
              ...store,
              productCount: syncedProducts,
              followersCount: businessAccount.followers_count
            },
            syncedProducts,
            message: `Successfully connected @${businessAccount.username} and synced ${syncedProducts} products from Instagram Business API`
          });

        } catch (apiError: any) {
          console.error("Instagram API error:", apiError);
          return res.status(400).json({
            message: "Failed to connect with Instagram Business API. Please check your access token or try manual mode instead."
          });
        }
      }

    } catch (error: any) {
      console.error("Error connecting Instagram store:", error);
      res.status(500).json({ 
        message: "Failed to create Instagram store: " + (error.message || "Unknown error") 
      });
    }
  });

  // Get Instagram products for authenticated seller
  app.get("/api/vyronainstastore/products", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const store = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      if (!store) {
        return res.status(404).json({ message: "Instagram store not found" });
      }

      const products = await storage.getInstagramProducts(store.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching Instagram products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Add new Instagram product
  app.post("/api/vyronainstastore/products", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const store = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      if (!store) {
        return res.status(404).json({ message: "Instagram store not found" });
      }

      const { productName, description, price, categoryTag, hashtags, productUrl, imageUrl } = req.body;

      const productData = {
        storeId: store.id,
        instagramMediaId: `manual_${Date.now()}`,
        productName,
        description,
        price: Math.round(price), // Store as direct rupees
        categoryTag,
        hashtags: hashtags ? hashtags.split('#').filter((tag: string) => tag.trim()).map((tag: string) => tag.trim()) : [],
        productUrl,
        imageUrl: imageUrl || `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop`,
        isAvailable: true,
      };

      const product = await storage.createInstagramProduct(productData);
      res.json({ success: true, product });
    } catch (error) {
      console.error("Error adding Instagram product:", error);
      res.status(500).json({ message: "Failed to add product" });
    }
  });

  // Bulk import Instagram products via CSV
  app.post("/api/vyronainstastore/products/bulk-import", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const store = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      if (!store) {
        return res.status(404).json({ message: "Instagram store not found" });
      }

      const { products } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "Products array is required" });
      }

      const importedProducts = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        try {
          // Validate required fields
          if (!product.productName || !product.price) {
            errors.push(`Row ${i + 1}: Product name and price are required`);
            continue;
          }

          const productData = {
            storeId: store.id,
            instagramMediaId: `bulk_${Date.now()}_${i}`,
            productName: product.productName.trim(),
            description: product.description || '',
            price: Math.round(parseFloat(product.price)), // Store as direct rupees
            categoryTag: product.categoryTag || 'general',
            hashtags: product.hashtags ? 
              product.hashtags.split(/[#,\s]+/).filter((tag: string) => tag.trim()).map((tag: string) => tag.trim()) : 
              [],
            productUrl: product.productUrl || `https://instagram.com/p/bulk_${Date.now()}_${i}`,
            imageUrl: product.imageUrl || `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&random=${Date.now()}_${i}`,
            isAvailable: true,
          };

          const importedProduct = await storage.createInstagramProduct(productData);
          importedProducts.push(importedProduct);
        } catch (productError) {
          console.error(`Error importing product ${i + 1}:`, productError);
          errors.push(`Row ${i + 1}: ${productError.message || 'Failed to import product'}`);
        }
      }

      res.json({ 
        success: true, 
        importedCount: importedProducts.length,
        totalAttempted: products.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully imported ${importedProducts.length} out of ${products.length} products`
      });
    } catch (error) {
      console.error("Error bulk importing Instagram products:", error);
      res.status(500).json({ message: "Failed to bulk import products" });
    }
  });

  // Import products from Instagram profile link (scraping simulation)
  app.post("/api/vyronainstastore/import-from-profile", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const store = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      if (!store) {
        return res.status(404).json({ message: "Instagram store not found" });
      }

      const { profileUrl, maxProducts = 20 } = req.body;

      if (!profileUrl) {
        return res.status(400).json({ message: "Instagram profile URL is required" });
      }

      // Simulate profile scraping with realistic product data
      const scrapedProducts = [];
      const productTemplates = [
        { name: "Handmade Jewelry", category: "accessories", basePrice: 35 },
        { name: "Vintage Clothing", category: "fashion", basePrice: 55 },
        { name: "Art Print", category: "art", basePrice: 25 },
        { name: "Skincare Product", category: "beauty", basePrice: 45 },
        { name: "Home Decor", category: "home", basePrice: 65 },
        { name: "Phone Case", category: "tech", basePrice: 20 },
        { name: "Tote Bag", category: "accessories", basePrice: 30 },
        { name: "Candle", category: "home", basePrice: 18 },
        { name: "Stickers Pack", category: "stationery", basePrice: 8 },
        { name: "Coffee Mug", category: "kitchen", basePrice: 22 }
      ];

      const numProducts = Math.min(maxProducts, Math.floor(Math.random() * 15) + 5);

      for (let i = 0; i < numProducts; i++) {
        const template = productTemplates[Math.floor(Math.random() * productTemplates.length)];
        const variation = Math.floor(Math.random() * 5) + 1;
        
        const productData = {
          storeId: store.id,
          instagramMediaId: `scraped_${Date.now()}_${i}`,
          productName: `${template.name} ${variation}`,
          description: `Beautiful ${template.name.toLowerCase()} from Instagram post`,
          price: Math.round(template.basePrice + Math.random() * 20), // Store as direct rupees
          categoryTag: template.category,
          hashtags: [`${template.category}`, "handmade", "instagram", "shop"],
          productUrl: `https://instagram.com/p/scraped_${Date.now()}_${i}`,
          imageUrl: `https://images.unsplash.com/photo-${1400000000000 + Math.floor(Math.random() * 500000000)}?w=400&h=400&fit=crop`,
          isAvailable: true,
        };

        const product = await storage.createInstagramProduct(productData);
        scrapedProducts.push(product);
      }

      res.json({ 
        success: true, 
        importedCount: scrapedProducts.length,
        message: `Successfully imported ${scrapedProducts.length} products from Instagram profile`,
        note: "This is a simulation of profile scraping. In production, this would analyze actual Instagram posts."
      });
    } catch (error) {
      console.error("Error importing from Instagram profile:", error);
      res.status(500).json({ message: "Failed to import from Instagram profile" });
    }
  });

  // Place Instagram order (for customers)
  app.post("/api/instagram/orders/place", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { items, shippingAddress, paymentMethod, upiId, totalAmount } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }

      if (!shippingAddress) {
        return res.status(400).json({ message: "Shipping address is required" });
      }

      // Group items by store to create consolidated orders per store
      const itemsByStore = new Map();
      
      for (const item of items) {
        // Get the product to find its storeId
        const product = await storage.getInstagramProduct(item.id);
        if (!product) {
          throw new Error(`Product ${item.id} not found`);
        }

        const storeId = product.storeId;
        if (!itemsByStore.has(storeId)) {
          itemsByStore.set(storeId, {
            storeId,
            items: [],
            totalAmount: 0
          });
        }

        const storeGroup = itemsByStore.get(storeId);
        storeGroup.items.push({
          ...item,
          product
        });
        
        // Calculate total amount for this store (prices already in rupees)
        const priceInRupees = item.price;
        storeGroup.totalAmount += priceInRupees * item.quantity;
      }

      // Create one consolidated order per store
      const createdOrders = [];
      
      for (const [storeId, storeGroup] of itemsByStore) {
        // Create order with multiple items as JSON in orderNotes
        const itemsDetails = storeGroup.items.map(item => ({
          productId: item.id,
          productName: item.product.productName,
          quantity: item.quantity,
          price: Math.round(item.price),
          total: Math.round(item.price) * item.quantity
        }));

        const orderData = {
          buyerId: authenticatedUser.id,
          storeId: storeId,
          productId: storeGroup.items[0].id, // Primary product (for compatibility)
          quantity: storeGroup.items.reduce((sum, item) => sum + item.quantity, 0), // Total quantity
          totalAmount: storeGroup.totalAmount,
          status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
          shippingAddress: shippingAddress,
          contactInfo: {
            email: authenticatedUser.email,
            paymentMethod: paymentMethod,
            upiTransactionId: paymentMethod === 'upi' ? `UPI_${Date.now()}_${authenticatedUser.id}` : null
          },
          orderNotes: `Multi-item Instagram order - ${storeGroup.items.length} items - Payment: ${paymentMethod} - Items: ${JSON.stringify(itemsDetails)}`
        };

        const order = await storage.createInstagramOrder(orderData);
        createdOrders.push({
          ...order,
          itemsDetails // Add for email notification
        });
      }

      const mainOrder = createdOrders[0]; // Use first order for response

      // Send email notifications to sellers for each order
      for (const order of createdOrders) {
        try {
          // Get store and seller information
          const store = await storage.getInstagramStoreById(order.storeId);
          if (!store) continue;

          const seller = await storage.getUser(store.userId);
          if (!seller || !seller.email) continue;

          // Get product information
          const product = await storage.getInstagramProduct(order.productId);
          if (!product) continue;

          // Get customer information
          const customer = await storage.getUser(order.buyerId);
          if (!customer) continue;

          // Prepare email data for Instagram seller notification
          const emailData = {
            orderId: order.id,
            sellerName: seller.username,
            sellerEmail: seller.email,
            storeName: store.storeName || store.instagramUsername,
            customerName: customer.username,
            customerEmail: customer.email,
            customerPhone: shippingAddress.phone || customer.mobile || 'Not provided',
            productName: product.productName,
            productPrice: product.price, // Price in cents
            quantity: order.quantity,
            totalAmount: order.totalAmount, // Total in cents
            paymentMethod: paymentMethod,
            shippingAddress: {
              name: shippingAddress.name,
              addressLine1: shippingAddress.addressLine1,
              addressLine2: shippingAddress.addressLine2 || '',
              city: shippingAddress.city,
              state: shippingAddress.state,
              pincode: shippingAddress.pincode,
              phone: shippingAddress.phone,
              email: shippingAddress.email || customer.email
            },
            orderDate: new Date().toISOString(),
            orderStatus: order.status
          };

          // Generate and send Instagram seller notification email
          const { subject, htmlContent } = generateInstagramSellerNotificationEmail(emailData);
          
          await sendBrevoEmail({
            to: seller.email,
            subject,
            htmlContent
          });

          console.log(`Instagram seller notification sent to ${seller.email} for order #${order.id}`);
        } catch (emailError) {
          console.error(`Failed to send seller notification for order #${order.id}:`, emailError);
          // Don't fail the order if email fails
        }
      }

      // Send customer confirmation email
      try {
        const customer = await storage.getUser(authenticatedUser.id);
        if (customer && (shippingAddress.email || customer.email)) {
          // Prepare customer email data
          const customerEmailData = {
            orderId: mainOrder.id,
            customerName: customer.username,
            customerEmail: shippingAddress.email || customer.email,
            items: [],
            totalAmount: createdOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            paymentMethod: paymentMethod,
            shippingAddress: {
              name: shippingAddress.name,
              addressLine1: shippingAddress.addressLine1,
              addressLine2: shippingAddress.addressLine2 || '',
              city: shippingAddress.city,
              state: shippingAddress.state,
              pincode: shippingAddress.pincode,
              phone: shippingAddress.phone
            },
            orderDate: new Date().toISOString(),
            trackingNumber: `IG${Date.now().toString().slice(-8)}`
          };

          // Extract items from orderNotes for multi-item orders
          for (const order of createdOrders) {
            try {
              if (order.orderNotes && order.orderNotes.includes('Multi-item Instagram order')) {
                const itemsMatch = order.orderNotes.match(/Items: (\[.*\])/);
                if (itemsMatch) {
                  const items = JSON.parse(itemsMatch[1]);
                  customerEmailData.items.push(...items);
                } else {
                  // Fallback for single item
                  const product = await storage.getInstagramProduct(order.productId);
                  customerEmailData.items.push({
                    productName: product?.productName || 'Product',
                    quantity: order.quantity,
                    price: Math.round(order.totalAmount / order.quantity),
                    total: order.totalAmount
                  });
                }
              } else {
                // Single item order
                const product = await storage.getInstagramProduct(order.productId);
                customerEmailData.items.push({
                  productName: product?.productName || 'Product',
                  quantity: order.quantity,
                  price: Math.round(order.totalAmount / order.quantity),
                  total: order.totalAmount
                });
              }
            } catch (parseError) {
              console.error('Error parsing order items:', parseError);
              // Fallback
              const product = await storage.getInstagramProduct(order.productId);
              customerEmailData.items.push({
                productName: product?.productName || 'Product',
                quantity: order.quantity,
                price: Math.round(order.totalAmount / order.quantity),
                total: order.totalAmount
              });
            }
          }

          // Generate customer confirmation email
          const customerEmailSubject = `Order Confirmation #${mainOrder.id} - VyronaInstaStore`;
          const customerEmailContent = generateInstagramCustomerConfirmationEmail(customerEmailData);

          await sendBrevoEmail({
            to: shippingAddress.email || customer.email,
            subject: customerEmailSubject,
            htmlContent: customerEmailContent
          });

          console.log(`Instagram order confirmation sent to ${shippingAddress.email || customer.email} for order #${mainOrder.id}`);
        }
      } catch (emailError) {
        console.error(`Failed to send Instagram customer confirmation for order #${mainOrder.id}:`, emailError);
      }

      // Clear Instagram cart if order was placed from cart
      if (req.body.source === 'instagram') {
        await storage.clearInstagramCart(authenticatedUser.id);
      }

      res.json({ 
        success: true,
        orderId: mainOrder.id,
        trackingNumber: `IG${Date.now().toString().slice(-8)}`,
        message: "Instagram order placed successfully"
      });

    } catch (error) {
      console.error("Error placing Instagram order:", error);
      res.status(500).json({ message: "Failed to place order" });
    }
  });

  // Get Instagram orders for authenticated seller
  app.get("/api/vyronainstastore/orders", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const store = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      if (!store) {
        return res.status(404).json({ message: "Instagram store not found" });
      }

      const orders = await storage.getInstagramOrders(store.id);
      
      // Enhance orders with product details
      const enhancedOrders = await Promise.all(orders.map(async (order: any) => {
        const product = await storage.getInstagramProduct(order.productId);
        return {
          ...order,
          productName: product?.productName || 'Unknown Product',
          productImage: product?.imageUrl,
        };
      }));

      res.json(enhancedOrders);
    } catch (error) {
      console.error("Error fetching Instagram orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update Instagram order status
  app.put("/api/vyronainstastore/orders/:orderId/status", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const { orderId } = req.params;
      const { status, orderNotes } = req.body;

      // Get the seller's store first to verify ownership
      const sellerStore = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      if (!sellerStore) {
        return res.status(404).json({ message: "Instagram store not found for this seller" });
      }

      // Get current order details before updating
      const currentOrder = await db
        .select()
        .from(instagramOrders)
        .where(eq(instagramOrders.id, parseInt(orderId)))
        .limit(1);

      if (!currentOrder.length) {
        return res.status(404).json({ message: "Order not found" });
      }

      const order = currentOrder[0];

      // CRITICAL SECURITY CHECK: Verify the seller owns this order
      if (order.storeId !== sellerStore.id) {
        return res.status(403).json({ message: "Access denied. You can only update orders from your own store." });
      }

      // Get product details
      const product = await storage.getInstagramProduct(order.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get store details
      const store = await storage.getInstagramStoreById(order.storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Get seller details
      const seller = await storage.getUser(store.userId);
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // Update order status
      const updatedOrder = await storage.updateInstagramOrderStatus(
        parseInt(orderId), 
        status
      );

      if (!updatedOrder) {
        return res.status(404).json({ message: "Failed to update order" });
      }

      // Send automated email notification to customer
      try {
        const emailData = {
          orderId: updatedOrder.id,
          sellerName: seller.username,
          sellerEmail: seller.email,
          storeName: store.storeName || store.instagramUsername,
          customerName: updatedOrder.shippingAddress.name,
          customerEmail: updatedOrder.shippingAddress.email,
          customerPhone: updatedOrder.shippingAddress.phone,
          productName: product.productName,
          productPrice: product.price,
          quantity: updatedOrder.quantity,
          totalAmount: updatedOrder.totalAmount,
          paymentMethod: updatedOrder.contactInfo?.paymentMethod || 'Not specified',
          shippingAddress: updatedOrder.shippingAddress,
          orderDate: updatedOrder.createdAt?.toLocaleDateString() || new Date().toLocaleDateString(),
          orderStatus: status
        };

        const { subject, htmlContent } = generateInstagramOrderStatusEmail(emailData);
        
        await sendBrevoEmail({
          to: updatedOrder.shippingAddress.email,
          subject,
          htmlContent
        });

        console.log(`Order status update email sent to: ${updatedOrder.shippingAddress.email}`);
      } catch (emailError) {
        console.error("Failed to send order status email:", emailError);
        // Don't fail the order update if email fails
      }

      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error("Error updating Instagram order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Get Instagram analytics
  app.get("/api/vyronainstastore/analytics", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const store = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      if (!store) {
        return res.status(404).json({ message: "Instagram store not found" });
      }

      // Get last 30 days of analytics
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const analytics = await storage.getInstagramAnalytics(store.id, startDate, endDate);
      
      // Aggregate analytics data
      const aggregatedAnalytics = analytics.reduce((acc, day) => ({
        impressions: acc.impressions + (day.impressions || 0),
        reach: acc.reach + (day.reach || 0),
        profileViews: acc.profileViews + (day.profileViews || 0),
        websiteClicks: acc.websiteClicks + (day.websiteClicks || 0),
        ordersCount: acc.ordersCount + (day.ordersCount || 0),
        revenue: acc.revenue + (day.revenue || 0),
      }), {
        impressions: 0,
        reach: 0,
        profileViews: 0,
        websiteClicks: 0,
        ordersCount: 0,
        revenue: 0,
      });

      res.json(aggregatedAnalytics);
    } catch (error) {
      console.error("Error fetching Instagram analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Clean up orphaned Instagram products (admin only)
  app.post("/api/admin/cleanup-orphaned-instagram-products", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Find and remove products that don't have a corresponding store
      const orphanedProducts = await db.execute(sql`
        DELETE FROM instagram_products 
        WHERE store_id NOT IN (
          SELECT id FROM instagram_stores
        )
        RETURNING id, product_name
      `);

      const deletedCount = orphanedProducts.rows.length;
      console.log(`Admin cleanup: Removed ${deletedCount} orphaned Instagram products`);

      res.json({ 
        success: true, 
        deletedCount,
        message: `Successfully removed ${deletedCount} orphaned Instagram products`
      });
    } catch (error: any) {
      console.error('Error cleaning up orphaned products:', error);
      res.status(500).json({ message: "Failed to cleanup orphaned products" });
    }
  });

  // Sync Instagram data (placeholder for actual Instagram API integration)
  app.post("/api/vyronainstastore/sync", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronainstastore') {
        return res.status(401).json({ message: "VyronaInstaStore seller authentication required" });
      }

      const store = await storage.getInstagramStoreByUserId(authenticatedUser.id);
      if (!store) {
        return res.status(404).json({ message: "Instagram store not found" });
      }

      // Update last sync time
      await storage.updateInstagramStore(store.id, { lastSyncAt: new Date() });

      res.json({ success: true, message: "Instagram data synced successfully" });
    } catch (error) {
      console.error("Error syncing Instagram data:", error);
      res.status(500).json({ message: "Failed to sync Instagram data" });
    }
  });

  // Customer-facing Instagram API endpoints (public)
  
  // Get all public Instagram products for customer browsing
  app.get("/api/instagram/products", async (req, res) => {
    try {
      // Get all Instagram products from active stores with store information
      const products = await db
        .select({
          id: instagramProducts.id,
          storeId: instagramProducts.storeId,
          instagramMediaId: instagramProducts.instagramMediaId,
          productName: instagramProducts.productName,
          description: instagramProducts.description,
          price: instagramProducts.price,
          currency: instagramProducts.currency,
          imageUrl: instagramProducts.imageUrl,
          productUrl: instagramProducts.productUrl,
          isAvailable: instagramProducts.isAvailable,
          categoryTag: instagramProducts.categoryTag,
          hashtags: instagramProducts.hashtags,
          likesCount: instagramProducts.likesCount,
          commentsCount: instagramProducts.commentsCount,
          createdAt: instagramProducts.createdAt,
          updatedAt: instagramProducts.updatedAt,
          // Store information
          instagramUsername: instagramStores.instagramUsername,
          storeName: instagramStores.storeName,
        })
        .from(instagramProducts)
        .innerJoin(instagramStores, eq(instagramProducts.storeId, instagramStores.id))
        .where(
          and(
            eq(instagramProducts.isAvailable, true),
            eq(instagramStores.isActive, true)
          )
        );

      // Return products with prices as stored (already in whole rupees)
      res.json(products);
    } catch (error) {
      console.error("Error fetching public Instagram products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get all public Instagram stores for customer browsing
  app.get("/api/instagram/stores", async (req, res) => {
    try {
      // Get all active Instagram stores
      const stores = await db
        .select({
          id: instagramStores.id,
          instagramUsername: instagramStores.instagramUsername,
          storeName: instagramStores.storeName,
          storeDescription: instagramStores.storeDescription,
          followersCount: instagramStores.followersCount,
        })
        .from(instagramStores)
        .where(eq(instagramStores.isActive, true));

      res.json(stores);
    } catch (error) {
      console.error("Error fetching public Instagram stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  // Instagram Cart API endpoints
  
  // Get Instagram cart items
  app.get("/api/instacart", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const cartItems = await storage.getInstagramCartItems(authenticatedUser.id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching Instagram cart:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  // Add item to Instagram cart
  app.post("/api/instacart/add", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { productId, quantity = 1, price } = req.body;
      
      // Store price directly as received (already in rupees)
      const priceInRupees = Math.round(parseFloat(price));
      
      // Check if item already exists in cart
      const existingItem = await storage.getInstagramCartItem(authenticatedUser.id, productId);
      
      if (existingItem) {
        // Update quantity
        await storage.updateInstagramCartItem(authenticatedUser.id, productId, existingItem.quantity + quantity);
      } else {
        // Add new item
        await storage.addInstagramCartItem({
          userId: authenticatedUser.id,
          productId,
          quantity,
          price: priceInRupees
        });
      }

      res.json({ success: true, message: "Item added to cart" });
    } catch (error) {
      console.error("Error adding to Instagram cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // Update Instagram cart item quantity
  app.put("/api/instacart/:productId", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { productId } = req.params;
      const { quantity } = req.body;

      await storage.updateInstagramCartItem(authenticatedUser.id, parseInt(productId), quantity);
      res.json({ success: true, message: "Cart updated" });
    } catch (error) {
      console.error("Error updating Instagram cart:", error);
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  // Remove item from Instagram cart
  app.delete("/api/instacart/:productId", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { productId } = req.params;
      await storage.removeInstagramCartItem(authenticatedUser.id, parseInt(productId));
      res.json({ success: true, message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from Instagram cart:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  // Clear Instagram cart
  app.delete("/api/instacart/clear", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      await storage.clearInstagramCart(authenticatedUser.id);
      res.json({ success: true, message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing Instagram cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Apply promo code to Instagram cart
  app.post("/api/instacart/promo", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { code } = req.body;
      
      // Simple promo code logic - can be expanded
      const promoDiscounts: { [key: string]: number } = {
        'INSTA10': 10,
        'WELCOME15': 15,
        'SOCIAL20': 20
      };

      const discount = promoDiscounts[code.toUpperCase()];
      if (!discount) {
        return res.status(400).json({ message: "Invalid promo code" });
      }

      res.json({ success: true, discount, message: `${discount}% discount applied!` });
    } catch (error) {
      console.error("Error applying promo code:", error);
      res.status(500).json({ message: "Failed to apply promo code" });
    }
  });

  // Create VyronaInstaStore seller account
  app.post("/api/create-vyronainstastore-seller", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create VyronaInstaStore seller user
      const userData = {
        username,
        email,
        password,
        role: 'seller',
        sellerType: 'vyronainstastore'
      };

      const newUser = await storage.createUser(userData);
      
      res.json({ 
        success: true, 
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          sellerType: newUser.sellerType
        },
        message: "VyronaInstaStore seller account created successfully" 
      });
    } catch (error) {
      console.error("Error creating VyronaInstaStore seller:", error);
      res.status(500).json({ message: "Failed to create seller account" });
    }
  });

  // E-Book bulk CSV import endpoint for VyronaRead sellers
  app.post("/api/vyronaread/ebooks", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronaread') {
        return res.status(401).json({ message: "VyronaRead seller authentication required" });
      }

      const {
        title,
        author,
        isbn,
        category,
        format,
        description,
        salePrice,
        rentalPrice,
        publisher,
        publicationYear,
        language,
        status
      } = req.body;

      // Validate required fields
      if (!title || !author || !category || !salePrice || !rentalPrice) {
        return res.status(400).json({ message: "Missing required fields: title, author, category, salePrice, rentalPrice" });
      }

      // Validate pricing
      const salePriceNum = parseFloat(salePrice);
      const rentalPriceNum = parseFloat(rentalPrice);
      
      if (isNaN(salePriceNum) || salePriceNum <= 0 || isNaN(rentalPriceNum) || rentalPriceNum <= 0) {
        return res.status(400).json({ message: "Invalid pricing values" });
      }

      // Handle Google Drive URLs or file paths
      const { coverImageUrl, fileUrl } = req.body;
      
      // Create e-book record with Google Drive URL support
      const ebookData = {
        title,
        author,
        isbn: isbn || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: category.toLowerCase(),
        format: format || 'PDF',
        description: description || '',
        salePrice: Math.round(salePriceNum), // Store in cents
        rentalPrice: Math.round(rentalPriceNum), // Store in cents
        publisher: publisher || 'Unknown Publisher',
        publicationYear: publicationYear || new Date().getFullYear().toString(),
        language: language || 'English',
        fileUrl: fileUrl || '', // Google Drive URL for e-book file
        fileName: fileUrl ? fileUrl.split('/').pop() || 'ebook-file' : '',
        fileSize: 0, // Size unknown for Google Drive files
        coverImageUrl: coverImageUrl || '', // Google Drive URL for cover image
        coverImageName: coverImageUrl ? coverImageUrl.split('/').pop() || 'cover-image' : '',
        sellerId: authenticatedUser.id,
        status: status || 'active'
      };

      const ebook = await storage.createEbook(ebookData);

      res.json({
        success: true,
        ebook: {
          ...ebook,
          salePrice: ebook.salePrice / 100, // Convert back to rupees for display
          rentalPrice: ebook.rentalPrice / 100
        },
        message: "E-book created successfully"
      });
    } catch (error) {
      console.error("E-book creation error:", error);
      res.status(500).json({ message: "Failed to create e-book" });
    }
  });

  // E-Book API endpoints with enhanced pricing control
  app.post("/api/ebooks", upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller') {
        return res.status(401).json({ message: "Seller authentication required" });
      }

      const {
        title,
        author,
        isbn,
        category,
        format,
        description,
        salePrice,
        rentalPrice,
        publisher,
        publicationYear,
        language
      } = req.body;

      // Extract uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const ebookFile = files?.file?.[0];
      const coverImageFile = files?.coverImage?.[0];

      // Validate required fields including cover image
      if (!title || !author || !category || !salePrice || !rentalPrice || !ebookFile || !coverImageFile) {
        return res.status(400).json({ message: "Missing required fields including e-book file and cover image" });
      }

      // Validate pricing
      const salePriceNum = parseFloat(salePrice);
      const rentalPriceNum = parseFloat(rentalPrice);
      
      if (isNaN(salePriceNum) || salePriceNum <= 0 || isNaN(rentalPriceNum) || rentalPriceNum <= 0) {
        return res.status(400).json({ message: "Invalid pricing values" });
      }

      // Create e-book record with both file and cover image
      const ebookData = {
        title,
        author,
        isbn: isbn || null,
        category,
        format: format || 'PDF',
        description: description || '',
        salePrice: Math.round(salePriceNum), // Store in cents
        rentalPrice: Math.round(rentalPriceNum), // Store in cents
        publisher: publisher || '',
        publicationYear: publicationYear || '',
        language: language || 'English',
        fileUrl: ebookFile.path,
        fileName: ebookFile.filename,
        fileSize: ebookFile.size,
        coverImageUrl: coverImageFile.path,
        coverImageName: coverImageFile.filename,
        sellerId: authenticatedUser.id,
        status: 'active' as const
      };

      const ebook = await storage.createEbook(ebookData);

      res.json({
        success: true,
        ebook: {
          ...ebook,
          salePrice: ebook.salePrice / 100, // Convert back to rupees for display
          rentalPrice: ebook.rentalPrice / 100
        },
        message: "E-book uploaded successfully"
      });
    } catch (error) {
      console.error("E-book upload error:", error);
      res.status(500).json({ message: "Failed to upload e-book" });
    }
  });

  // Get seller's e-books
  app.get("/api/ebooks/seller/:sellerId", async (req, res) => {
    try {
      const sellerId = parseInt(req.params.sellerId);
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser || (authenticatedUser.role !== 'seller' && authenticatedUser.role !== 'admin')) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Sellers can only see their own e-books, admins can see all
      if (authenticatedUser.role === 'seller' && authenticatedUser.id !== sellerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const ebooks = await storage.getSellerEbooks(sellerId);
      
      // Convert pricing from cents to rupees for display
      const formattedEbooks = ebooks.map(ebook => ({
        ...ebook,
        salePrice: ebook.salePrice / 100,
        rentalPrice: ebook.rentalPrice / 100
      }));

      res.json(formattedEbooks);
    } catch (error) {
      console.error("Error fetching seller e-books:", error);
      res.status(500).json({ message: "Failed to fetch e-books" });
    }
  });

  // Get e-books for customers (VyronaRead customer interface)
  app.get("/api/ebooks", async (req, res) => {
    try {
      const { category, search, limit = 50, offset = 0 } = req.query;
      
      const ebooks = await storage.getEbooks({
        category: category as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      // Convert pricing from cents to rupees for display
      const formattedEbooks = ebooks.map(ebook => ({
        ...ebook,
        salePrice: ebook.salePrice / 100,
        rentalPrice: ebook.rentalPrice / 100
      }));

      res.json(formattedEbooks);
    } catch (error) {
      console.error("Error fetching e-books:", error);
      res.status(500).json({ message: "Failed to fetch e-books" });
    }
  });

  // Update e-book pricing
  app.patch("/api/ebooks/:id/pricing", async (req, res) => {
    try {
      const ebookId = parseInt(req.params.id);
      const authenticatedUser = getAuthenticatedUser(req);
      
      if (!authenticatedUser || authenticatedUser.role !== 'seller') {
        return res.status(401).json({ message: "Seller authentication required" });
      }

      const { salePrice, rentalPrice } = req.body;

      // Validate pricing
      const salePriceNum = parseFloat(salePrice);
      const rentalPriceNum = parseFloat(rentalPrice);
      
      if (isNaN(salePriceNum) || salePriceNum <= 0 || isNaN(rentalPriceNum) || rentalPriceNum <= 0) {
        return res.status(400).json({ message: "Invalid pricing values" });
      }

      // Check if seller owns this e-book
      const ebook = await storage.getEbook(ebookId);
      if (!ebook || ebook.sellerId !== authenticatedUser.id) {
        return res.status(404).json({ message: "E-book not found or access denied" });
      }

      const updatedEbook = await storage.updateEbookPricing(ebookId, {
        salePrice: Math.round(salePriceNum),
        rentalPrice: Math.round(rentalPriceNum)
      });

      res.json({
        success: true,
        ebook: {
          ...updatedEbook,
          salePrice: updatedEbook.salePrice / 100,
          rentalPrice: updatedEbook.rentalPrice / 100
        },
        message: "E-book pricing updated successfully"
      });
    } catch (error) {
      console.error("Error updating e-book pricing:", error);
      res.status(500).json({ message: "Failed to update pricing" });
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
        price: Math.round(parseFloat(fixedCostPrice) || 0), // Convert to cents
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
        imageUrl: imageUrl || null, // Include the book cover image URL
        category: category || null,
        copies: copies || 1,
        available: copies || 1,
        publisher: publisher || null,
        publicationYear: publicationYear || null,
        description: description || null,
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
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get rentals for this seller
      const rentals = await storage.getSellerRentals(user.id);
      res.json(rentals);
    } catch (error) {
      console.error("Error fetching seller rentals:", error);
      res.status(500).json({ error: "Failed to fetch seller rentals" });
    }
  });

  // Get seller's return requests
  app.get("/api/seller/return-requests", async (req: Request, res: Response) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const returnRequests = await storage.getSellerReturnRequests(user.id);
      res.json(returnRequests);
    } catch (error) {
      console.error("Error fetching seller return requests:", error);
      res.status(500).json({ error: "Failed to fetch seller return requests" });
    }
  });

  // Customer-facing order endpoint for order confirmation page
  app.get("/api/order/:orderId", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Check Instagram orders
      console.log(`Searching for Instagram order with ID: ${orderId}`);
      const instaOrders = await db
        .select()
        .from(instagramOrders)
        .where(eq(instagramOrders.id, orderId));

      console.log(`Instagram orders found: ${instaOrders.length}`, instaOrders);
      if (instaOrders.length > 0) {
        const order = instaOrders[0];
        const response = {
          id: order.id,
          customerId: order.buyerId,
          totalAmount: order.totalAmount,
          paymentMethod: 'online',
          status: order.status,
          shippingAddress: order.shippingAddress,
          trackingNumber: null,
          createdAt: order.createdAt,
          orderType: 'instagram'
        };
        console.log(`Returning Instagram order:`, response);
        return res.json(response);
      }

      // Check VyronaHub orders
      const hubOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (hubOrders.length > 0) {
        const order = hubOrders[0];
        return res.json({
          id: order.id,
          customerId: order.customerId,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          shippingAddress: order.shippingAddress,
          trackingNumber: order.trackingNumber,
          createdAt: order.createdAt,
          orderType: 'vyronahub'
        });
      }

      // Check VyronaRead orders (book loans)
      const bookOrders = await db
        .select()
        .from(bookLoans)
        .where(eq(bookLoans.id, orderId));

      if (bookOrders.length > 0) {
        const order = bookOrders[0];
        return res.json({
          id: order.id,
          customerId: order.userId,
          totalAmount: order.loanType === 'rental' ? order.rentalFee : order.purchasePrice,
          paymentMethod: 'online',
          status: order.status,
          shippingAddress: null,
          trackingNumber: null,
          createdAt: order.createdAt,
          orderType: 'vyronaread'
        });
      }

      return res.status(404).json({ message: "Order not found" });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
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
      
      // Enhanced membership data with proper defaults
      const enhancedMembershipData = {
        fullName: membershipData.fullName,
        email: membershipData.email,
        phone: membershipData.phone,
        address: membershipData.address || "Not provided",
        membershipType: membershipData.membershipType || "annual",
        membershipFee: membershipData.fee || 2000,
        libraryId: membershipData.libraryId || 28, // Default to Aringar Anna Library
        bookId: membershipData.bookId,
        bookTitle: membershipData.bookTitle || 'Library Access',
        borrowingInfo: membershipData.borrowingInfo
      };
      
      const membership = await storage.createLibraryMembership(enhancedMembershipData);
      
      // Create notification for admin and seller
      await storage.createNotification({
        userId: enhancedMembershipData.libraryId, // Seller/Library ID
        type: "library_membership_request",
        title: "New Library Membership Application",
        message: `New membership application from ${enhancedMembershipData.fullName} for book "${enhancedMembershipData.bookTitle}"`,
        metadata: { membershipId: membership.id, bookId: enhancedMembershipData.bookId }
      });

      // Send library membership confirmation email
      try {
        const { sendLibraryMembershipEmail } = await import('./library-membership-email');
        
        // Get library names for the email
        const libraries = ["Aringar Anna Library"]; // Default library, should be dynamic
        
        const membershipEmailData = {
          membershipId: `VRL-${membership.id}-${Date.now()}`,
          customerName: enhancedMembershipData.fullName,
          customerEmail: enhancedMembershipData.email,
          membershipType: enhancedMembershipData.membershipType,
          membershipFee: enhancedMembershipData.membershipFee,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
          libraries: libraries,
          benefits: [
            "Unlimited book borrowing for one year",
            "14-day borrowing period per book",
            "Access to all partner libraries",
            "Priority booking for new releases",
            "Online book reservation system",
            "Extended borrowing on request"
          ]
        };
        
        const emailSent = await sendLibraryMembershipEmail(membershipEmailData);
        console.log(`Library membership confirmation email sent: ${emailSent}`);
      } catch (emailError) {
        console.error("Error sending library membership email:", emailError);
        // Don't fail the membership creation if email fails
      }

      res.json({
        success: true,
        membershipId: membership.id,
        message: "Library membership created successfully",
        membership: membership
      });
    } catch (error) {
      console.error("Error creating library membership:", error);
      res.status(500).json({ message: "Failed to create library membership" });
    }
  });

  // Handle library membership from checkout (when "New User" is selected)
  app.post("/api/library-membership", async (req, res) => {
    try {
      const membershipData = req.body;
      
      // Create order record with automatic activation for payment completion
      const order = await storage.createOrder({
        userId: 1, // Default user for now, should be from session
        totalAmount: (membershipData.fee || 2000) * 100, // Convert to paise
        status: membershipData.autoActivate ? "completed" : "pending", // Auto-activate if flag is set
        module: "library_membership",
        metadata: {
          fullName: membershipData.fullName,
          email: membershipData.email,
          phone: membershipData.phone,
          address: membershipData.address || "Not provided",
          membershipType: membershipData.membershipType || "annual",
          membershipFee: membershipData.fee || 2000,
          libraryId: membershipData.libraryId || 28,
          bookId: membershipData.bookId,
          bookTitle: membershipData.bookTitle || 'Library Access',
          borrowingInfo: membershipData.borrowingInfo,
          status: membershipData.autoActivate ? "activated" : "pending",
          applicationDate: new Date().toISOString(),
          activatedDate: membershipData.autoActivate ? new Date().toISOString() : null,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
      
      // Send library membership confirmation email
      try {
        const { sendLibraryMembershipEmail } = await import('./library-membership-email');
        
        // Get library names for the email
        const libraries = ["Aringar Anna Library"]; // Default library, should be dynamic
        
        const membershipEmailData = {
          membershipId: `VRL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          customerName: membershipData.fullName,
          customerEmail: membershipData.email,
          membershipType: membershipData.membershipType || "annual",
          membershipFee: membershipData.fee || 2000,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
          libraries: libraries,
          benefits: [
            "Unlimited book borrowing for one year",
            "14-day borrowing period per book",
            "Access to all partner libraries",
            "Priority booking for new releases",
            "Online book reservation system",
            "Extended borrowing on request"
          ]
        };
        
        const emailSent = await sendLibraryMembershipEmail(membershipEmailData);
        console.log(`Library membership confirmation email sent: ${emailSent}`);
        
        res.json({ 
          success: true, 
          membershipId: membershipEmailData.membershipId,
          message: "Library membership confirmed and email sent",
          emailSent: emailSent
        });
      } catch (emailError) {
        console.error("Error sending library membership email:", emailError);
        res.json({ 
          success: true, 
          membershipId: `VRL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          message: "Library membership confirmed but email failed",
          emailSent: false
        });
      }
    } catch (error) {
      console.error("Error processing library membership:", error);
      res.status(500).json({ message: "Failed to process library membership" });
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
        amount: Math.round(amount), // Convert to cents
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

      // Send customer confirmation email
      try {
        const { sendBrevoEmail } = await import('./brevo-email');
        
        const customerEmailResult = await sendBrevoEmail(
          customerInfo.email,
          "Purchase Confirmation - VyronaRead",
          `<h2>Thank you for your purchase!</h2>
            <p>Dear ${customerInfo.name},</p>
            <p>Your book purchase has been confirmed (Order #${order.id}).</p>
            <h3>Purchase Details:</h3>
            <ul>
              <li>Book ID: ${bookId}</li>
              <li>Amount Paid: ₹${amount.toFixed(2)}</li>
              <li>Payment Method: ${paymentMethod.toUpperCase()}</li>
              <li>Access Type: Lifetime</li>
            </ul>
            <p>You can access your purchased book from your VyronaRead account.</p>
            <p>Thank you for choosing VyronaRead!</p>
            <p>Best regards,<br>VyronaRead Team</p>`
        );
        
        if (customerEmailResult.success) {
          console.log(`Customer purchase confirmation sent to ${customerInfo.email}`);
        }
      } catch (customerEmailError) {
        console.error("Customer confirmation email failed:", customerEmailError);
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

      // Send customer rental confirmation email
      try {
        const { sendBrevoEmail } = await import('./brevo-email');
        
        const customerEmailResult = await sendBrevoEmail(
          customerInfo.email,
          "Rental Confirmation - VyronaRead",
          `<h2>Your book rental is confirmed!</h2>
            <p>Dear ${customerInfo.name},</p>
            <p>Your book rental has been confirmed (Order #${order.id}).</p>
            <h3>Rental Details:</h3>
            <ul>
              <li>Book ID: ${bookId}</li>
              <li>Rental Amount: ₹${amount.toFixed(2)}</li>
              <li>Rental Duration: ${duration} days</li>
              <li>Payment Method: ${paymentMethod.toUpperCase()}</li>
              <li>Access Expires: ${expiryDate.toLocaleDateString()}</li>
            </ul>
            <p>You can access your rented book from your VyronaRead account until the expiry date.</p>
            <p>Thank you for choosing VyronaRead!</p>
            <p>Best regards,<br>VyronaRead Team</p>`
        );
        
        if (customerEmailResult.success) {
          console.log(`Customer rental confirmation sent to ${customerInfo.email}`);
        }
      } catch (customerEmailError) {
        console.error("Customer rental confirmation email failed:", customerEmailError);
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

      // Send customer confirmation email for borrowing request
      try {
        const { sendBrevoEmail } = await import('./brevo-email');
        
        const customerEmailResult = await sendBrevoEmail(
          customerInfo.email,
          "Borrowing Request Submitted - VyronaRead",
          `<h2>Your borrowing request has been submitted!</h2>
            <p>Dear ${customerInfo.name},</p>
            <p>Your book borrowing request has been submitted successfully (Request #${order.id}).</p>
            <h3>Request Details:</h3>
            <ul>
              <li>Book ID: ${bookId}</li>
              <li>Request Type: Library Borrowing</li>
              <li>Status: Pending Approval</li>
              <li>Expected Duration: ${borrowingInfo?.duration || 'Not specified'} days</li>
              <li>Library ID: ${borrowingInfo?.libraryId || 'Not provided'}</li>
            </ul>
            <p>We will notify you once your borrowing request is approved by the seller.</p>
            <p>You can check the status of your request in your VyronaRead account.</p>
            <p>Thank you for using VyronaRead!</p>
            <p>Best regards,<br>VyronaRead Team</p>`
        );
        
        if (customerEmailResult.success) {
          console.log(`Customer borrowing confirmation sent to ${customerInfo.email}`);
        }
      } catch (customerEmailError) {
        console.error("Customer borrowing confirmation email failed:", customerEmailError);
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

  // VyronaRead Order Status Management API for 4-Stage Email System
  app.put("/api/vyronaread/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber, deliveryAddress, testMode } = req.body;
      
      // For testing purposes, allow test mode to bypass authentication
      if (testMode) {
        console.log("Test mode enabled - bypassing authentication for VyronaRead order status update");
      } else {
        const authenticatedUser = getAuthenticatedUser(req);
        if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronaread') {
          return res.status(401).json({ message: "VyronaRead seller authentication required" });
        }
      }

      // Validate status
      const validStatuses = ['processing', 'shipped', 'out for delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
      }

      // Get order details
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify order belongs to VyronaRead module
      if (order.module !== 'vyronaread') {
        return res.status(403).json({ message: "This order is not from VyronaRead" });
      }

      // Update order status
      const updatedOrder = await storage.updateOrderStatus(parseInt(orderId), {
        status,
        trackingNumber: trackingNumber || order.trackingNumber,
        deliveryAddress: deliveryAddress || order.deliveryAddress,
        statusUpdatedAt: new Date().toISOString()
      });

      if (!updatedOrder) {
        return res.status(500).json({ message: "Failed to update order status" });
      }

      // Extract customer info from order metadata
      const customerInfo = order.metadata?.customerInfo;
      if (!customerInfo || !customerInfo.email) {
        console.warn(`No customer email found for order #${orderId}`);
        return res.json({
          success: true,
          message: "Order status updated successfully (no email sent - missing customer info)",
          order: updatedOrder
        });
      }

      // Prepare order data for email
      const orderData = {
        orderId: parseInt(orderId),
        customerName: customerInfo.name || 'Valued Customer',
        customerEmail: customerInfo.email,
        orderTotal: order.totalAmount || 0,
        orderDate: order.createdAt || new Date().toISOString(),
        trackingNumber: trackingNumber || order.trackingNumber,
        deliveryAddress: deliveryAddress || order.deliveryAddress || customerInfo.address,
        orderItems: order.metadata?.bookId ? [{
          name: order.metadata.ebookTitle || `Book ID: ${order.metadata.bookId}`,
          author: order.metadata.ebookAuthor || 'Unknown Author',
          quantity: 1,
          price: order.totalAmount || 0,
          type: order.metadata.transactionType || order.metadata.purchaseType || 'Purchase'
        }] : []
      };

      // Send customer status update email using VyronaRead email system
      try {
        const { sendVyronaReadOrderStatusUpdate } = await import('./vyronaread-emails');
        
        const emailResult = await sendVyronaReadOrderStatusUpdate(
          customerInfo.email,
          orderData,
          status
        );

        if (emailResult.success) {
          console.log(`VyronaRead order status email sent successfully to ${customerInfo.email} for order #${orderId} - Status: ${status}`);
        } else {
          console.error(`Failed to send VyronaRead order status email:`, emailResult.error);
        }
      } catch (emailError) {
        console.error("VyronaRead order status email error:", emailError);
      }

      res.json({
        success: true,
        message: `Order status updated to ${status} and customer notification sent`,
        order: updatedOrder,
        emailSent: true
      });

    } catch (error) {
      console.error("Error updating VyronaRead order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Test endpoint for VyronaRead Order Status Management (bypasses authentication)
  app.put("/api/test/vyronaread/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber, deliveryAddress } = req.body;
      
      console.log(`Testing VyronaRead order status update for Order #${orderId} - Status: ${status}`);

      // Validate status
      const validStatuses = ['processing', 'shipped', 'out for delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
      }

      // Get order details
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update order status
      const updatedOrder = await storage.updateOrderStatus(parseInt(orderId), {
        status,
        trackingNumber: trackingNumber || order.trackingNumber,
        deliveryAddress: deliveryAddress || order.deliveryAddress,
        statusUpdatedAt: new Date().toISOString()
      });

      if (!updatedOrder) {
        return res.status(500).json({ message: "Failed to update order status" });
      }

      // Extract customer info from order metadata
      const customerInfo = order.metadata?.customerInfo;
      if (!customerInfo || !customerInfo.email) {
        console.warn(`No customer email found for order #${orderId}`);
        return res.json({
          success: true,
          message: "Order status updated successfully (no email sent - missing customer info)",
          order: updatedOrder
        });
      }

      // Prepare order data for email
      const orderData = {
        orderId: parseInt(orderId),
        customerName: customerInfo.name || 'Valued Customer',
        customerEmail: customerInfo.email,
        orderTotal: order.totalAmount || 0,
        orderDate: order.createdAt || new Date().toISOString(),
        trackingNumber: trackingNumber || order.trackingNumber,
        deliveryAddress: deliveryAddress || order.deliveryAddress || customerInfo.address,
        orderItems: order.metadata?.bookId ? [{
          name: order.metadata.ebookTitle || `Book ID: ${order.metadata.bookId}`,
          author: order.metadata.ebookAuthor || 'Unknown Author',
          quantity: 1,
          price: order.totalAmount || 0,
          type: order.metadata.transactionType || order.metadata.purchaseType || 'Purchase'
        }] : []
      };

      // Send customer status update email using VyronaRead email system
      try {
        const { sendVyronaReadOrderStatusUpdate } = await import('./vyronaread-emails');
        
        const emailResult = await sendVyronaReadOrderStatusUpdate(
          customerInfo.email,
          orderData,
          status
        );

        if (emailResult.success) {
          console.log(`VyronaRead order status email sent successfully to ${customerInfo.email} for order #${orderId} - Status: ${status}`);
        } else {
          console.error(`Failed to send VyronaRead order status email:`, emailResult.error);
        }
      } catch (emailError) {
        console.error("VyronaRead order status email error:", emailError);
      }

      res.json({
        success: true,
        message: `Order status updated to ${status} and customer notification sent`,
        order: updatedOrder,
        emailSent: true
      });

    } catch (error) {
      console.error("Error updating VyronaRead order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Test endpoint for retrieving VyronaRead orders (bypasses authentication)
  app.get("/api/test/vyronaread/orders", async (req, res) => {
    try {
      console.log("Testing VyronaRead orders retrieval");

      const { status, limit = 50, offset = 0 } = req.query;

      // Get VyronaRead orders
      const orders = await storage.getOrdersByModule('vyronaread', {
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      // Format orders for display
      const formattedOrders = orders.map(order => ({
        id: order.id,
        orderId: order.id,
        customerName: order.metadata?.customerInfo?.name || 'Unknown Customer',
        customerEmail: order.metadata?.customerInfo?.email || '',
        customerPhone: order.metadata?.customerInfo?.phone || '',
        orderType: order.metadata?.type || 'purchase',
        bookTitle: order.metadata?.ebookTitle || `Book ID: ${order.metadata?.bookId}`,
        bookAuthor: order.metadata?.ebookAuthor || 'Unknown Author',
        transactionType: order.metadata?.transactionType || order.metadata?.purchaseType || 'buy',
        amount: order.totalAmount || 0,
        status: JSON.parse(order.status || '{}')?.status || 'pending',
        orderDate: order.createdAt || new Date().toISOString(),
        trackingNumber: JSON.parse(order.status || '{}')?.trackingNumber || '',
        deliveryAddress: JSON.parse(order.status || '{}')?.deliveryAddress || order.metadata?.customerInfo?.address || '',
        metadata: order.metadata
      }));

      res.json({
        success: true,
        orders: formattedOrders,
        total: formattedOrders.length
      });

    } catch (error) {
      console.error("Error fetching VyronaRead orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get VyronaRead orders for seller dashboard with filtering
  app.get("/api/vyronaread/orders", async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (!authenticatedUser || authenticatedUser.role !== 'seller' || authenticatedUser.sellerType !== 'vyronaread') {
        return res.status(401).json({ message: "VyronaRead seller authentication required" });
      }

      const { status, limit = 50, offset = 0 } = req.query;

      // Get VyronaRead orders
      const orders = await storage.getOrdersByModule('vyronaread', {
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      // Format orders for seller dashboard
      const formattedOrders = orders.map(order => ({
        id: order.id,
        orderId: order.id,
        customerName: order.metadata?.customerInfo?.name || 'Unknown Customer',
        customerEmail: order.metadata?.customerInfo?.email || '',
        customerPhone: order.metadata?.customerInfo?.phone || '',
        orderType: order.metadata?.type || 'purchase',
        bookTitle: order.metadata?.ebookTitle || `Book ID: ${order.metadata?.bookId}`,
        bookAuthor: order.metadata?.ebookAuthor || 'Unknown Author',
        transactionType: order.metadata?.transactionType || order.metadata?.purchaseType || 'buy',
        amount: order.totalAmount || 0,
        status: order.status || 'pending',
        orderDate: order.createdAt || new Date().toISOString(),
        trackingNumber: order.trackingNumber || '',
        deliveryAddress: order.deliveryAddress || order.metadata?.customerInfo?.address || '',
        canCancel: order.metadata?.cancellationRequested || false,
        metadata: order.metadata
      }));

      res.json({
        success: true,
        orders: formattedOrders,
        total: formattedOrders.length
      });

    } catch (error) {
      console.error("Error fetching VyronaRead orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
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
      
      // Filter for online members and deduplicate by userId
      const seen = new Set();
      const onlineMembers = groupMembers.filter(member => {
        const userKey = `${member.userId}-${groupId}`;
        const onlineUser = onlineUsers.get(userKey);
        
        // Check if user is online and not already processed
        if (onlineUser && onlineUser.ws.readyState === WebSocket.OPEN && !seen.has(member.userId)) {
          seen.add(member.userId);
          return true;
        }
        return false;
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
        amount: Math.round(amount), // Convert to paise
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

  // Get books requested for borrowing in a library membership order
  app.get("/api/orders/:orderId/requested-books", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Get order details first
      const orderResult = await db.execute(sql`
        SELECT * FROM orders WHERE id = ${orderId}
      `);
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const order = orderResult.rows[0] as any;
      
      // For library membership orders, get the books from cart items
      if (order.module === 'library_membership') {
        const cartResult = await db.execute(sql`
          SELECT 
            ci.*,
            lb.title,
            lb.author,
            lb.isbn,
            lb.imageUrl,
            lb.category,
            lb.publisher,
            lb.publicationYear,
            lb.language
          FROM cart_items ci
          JOIN library_books lb ON ci.product_id = lb.id
          WHERE ci.user_id = ${order.user_id}
          AND ci.module = 'library_browsing'
        `);
        
        const requestedBooks = cartResult.rows.map((row: any) => ({
          id: row.id,
          bookId: row.product_id,
          title: row.title,
          author: row.author,
          isbn: row.isbn,
          imageUrl: row.imageUrl,
          category: row.category,
          publisher: row.publisher,
          publicationYear: row.publicationYear,
          language: row.language,
          quantity: row.quantity,
          rentalDuration: row.rental_duration,
          pricePerDay: row.price_per_day
        }));
        
        return res.json({ 
          success: true, 
          requestedBooks,
          totalBooks: requestedBooks.length
        });
      }
      
      res.json({ 
        success: true, 
        requestedBooks: [],
        totalBooks: 0
      });
      
    } catch (error: any) {
      console.error("Error fetching requested books:", error);
      res.status(500).json({ error: "Failed to fetch requested books" });
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
            amount: Math.round(amount / memberCount)
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

      // Remove products by seller_id column (VyronaRead specific)
      await db.execute(sql`
        DELETE FROM products WHERE seller_id = ${sellerId}
      `);

      // Remove VyronaRead specific data - physical books
      await db.execute(sql`
        DELETE FROM physical_books WHERE library_id = ${sellerId}
      `);

      // Remove VyronaRead specific data - e-books
      await db.execute(sql`
        DELETE FROM e_books WHERE seller_id = ${sellerId}
      `);

      // Remove VyronaRead specific data - book loans
      await db.execute(sql`
        DELETE FROM book_loans WHERE library_id = ${sellerId}
      `);

      // Remove Instagram specific data - get Instagram store first
      const instagramStore = await db.execute(sql`
        SELECT id FROM instagram_stores WHERE user_id = ${sellerId}
      `);

      if (instagramStore.rows.length > 0) {
        const storeId = instagramStore.rows[0].id;
        console.log(`Removing Instagram data for store ID ${storeId}`);

        // Remove Instagram orders for this store
        await db.execute(sql`
          DELETE FROM instagram_orders WHERE store_id = ${storeId}
        `);

        // Remove Instagram products for this store
        await db.execute(sql`
          DELETE FROM instagram_products WHERE store_id = ${storeId}
        `);

        // Remove Instagram analytics for this store
        await db.execute(sql`
          DELETE FROM instagram_analytics WHERE store_id = ${storeId}
        `);

        // Remove the Instagram store itself
        await db.execute(sql`
          DELETE FROM instagram_stores WHERE id = ${storeId}
        `);

        console.log(`Removed all Instagram data for store ID ${storeId}`);
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



  // Seller registration endpoint
  app.post("/api/seller/register", async (req: Request, res: Response) => {
    try {
      const registrationData = req.body;
      
      // Generate unique email and password for VyronaRead sellers
      if (registrationData.sellerType === "vyronaread") {
        const email = `${registrationData.businessName.toLowerCase().replace(/\s+/g, '')}@vyronaread.com`;
        const password = `vyread${Math.random().toString(36).substring(2, 8)}`;
        
        // Create VyronaRead seller account
        const newSeller = await db
          .insert(users)
          .values({
            username: registrationData.ownerName,
            email: email,
            mobile: registrationData.phone,
            role: 'seller',
            password: password
          })
          .returning({ id: users.id });
        
        const sellerId = newSeller[0].id;
        
        // Store additional seller metadata (you could create a sellers table for this)
        console.log("VyronaRead seller registered:", {
          sellerId,
          businessName: registrationData.businessName,
          category: registrationData.businessCategory,
          storeLibraryName: registrationData.storeLibraryName,
          address: registrationData.businessAddress
        });
        
        return res.json({
          success: true,
          sellerId: sellerId,
          credentials: {
            email: email,
            password: password
          },
          message: "VyronaRead seller registration successful"
        });
      } else if (registrationData.sellerType === "vyronainstastore") {
        // Generate unique email and password for VyronaInstaStore sellers
        const email = `${registrationData.businessName.toLowerCase().replace(/\s+/g, '')}@vyronainstastore.com`;
        const password = `vyinsta${Math.random().toString(36).substring(2, 8)}`;
        
        // Create VyronaInstaStore seller account
        const newSeller = await db
          .insert(users)
          .values({
            username: registrationData.ownerName,
            email: email,
            mobile: registrationData.phone,
            role: 'seller',
            sellerType: 'vyronainstastore',
            password: password
          })
          .returning({ id: users.id });
        
        const sellerId = newSeller[0].id;
        
        console.log("VyronaInstaStore seller registered:", {
          sellerId,
          businessName: registrationData.businessName,
          instagramHandle: registrationData.instagramHandle,
          category: registrationData.businessCategory
        });
        
        return res.json({
          success: true,
          sellerId: sellerId,
          credentials: {
            email: email,
            password: password
          },
          message: "VyronaInstaStore seller registration successful"
        });
      } else {
        // Handle other seller types (existing logic)
        console.log("General seller registration:", registrationData);
        
        return res.json({
          success: true,
          message: "Seller registration submitted for review"
        });
      }
      
    } catch (error) {
      console.error("Seller registration error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Registration failed. Please try again." 
      });
    }
  });

  // Helper function to create demo VyronaRead seller data
  async function createDemoReadSellerData(sellerId: any) {
    try {
      // No demo books created - sellers start with empty inventory
      console.log("VyronaRead demo seller data created successfully");

    } catch (error) {
      console.error('Error creating demo VyronaRead seller data:', error);
    }
  }

  // Helper function to create demo seller data
  async function createDemoSellerData(sellerId: any) {
    try {
      // Create demo products
      const demoProducts = [
        {
          name: 'Premium Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 2999,
          sellerId: sellerId,
          category: 'Electronics',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
        },
        {
          name: 'Smart Fitness Watch',
          description: 'Track your health and fitness with this advanced smartwatch',
          price: 4999,
          sellerId: sellerId,
          category: 'Electronics',
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'
        },
        {
          name: 'Organic Coffee Beans',
          description: 'Premium organic coffee beans from sustainable farms',
          price: 899,
          sellerId: sellerId,
          category: 'Food & Beverages',
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500'
        }
      ];

      for (const product of demoProducts) {
        await db.execute(sql`
          INSERT INTO products (name, description, price, store_id, category, image_url, module)
          VALUES (${product.name}, ${product.description}, ${product.price}, ${product.sellerId}, ${product.category}, ${product.imageUrl}, 'vyronahub')
          ON CONFLICT (name) DO NOTHING
        `);
      }

      // Create demo orders
      const demoOrders = [
        {
          userId: 1,
          totalAmount: 2999,
          status: 'delivered',
          module: 'vyronahub',
          metadata: JSON.stringify({ 
            sellerId: sellerId.toString(),
            shippingAddress: '123 Customer Street, Mumbai 400001',
            paymentMethod: 'Online'
          })
        },
        {
          userId: 1,
          totalAmount: 4999,
          status: 'processing',
          module: 'vyronahub',
          metadata: JSON.stringify({ 
            sellerId: sellerId.toString(),
            shippingAddress: '456 Buyer Avenue, Delhi 110001',
            paymentMethod: 'COD'
          })
        },
        {
          userId: 1,
          totalAmount: 899,
          status: 'pending',
          module: 'vyronahub',
          metadata: JSON.stringify({ 
            sellerId: sellerId.toString(),
            shippingAddress: '789 Purchase Road, Bangalore 560001',
            paymentMethod: 'Online'
          })
        }
      ];

      for (const order of demoOrders) {
        await db.execute(sql`
          INSERT INTO orders (user_id, total_amount, status, module, metadata, created_at)
          VALUES (${order.userId}, ${order.totalAmount}, ${order.status}, ${order.module}, ${order.metadata}, NOW())
        `);
      }
    } catch (error) {
      console.error('Error creating demo seller data:', error);
    }
  }

  // Create demo seller products for testing
  app.post("/api/create-demo-seller-data", async (req: Request, res: Response) => {
    try {
      // Get or create demo seller
      const sellers = await db.execute(sql`
        SELECT * FROM users WHERE email = 'seller@vyronahub.com' LIMIT 1
      `);
      
      let sellerId;
      if (sellers.rows.length === 0) {
        const newSeller = await db.execute(sql`
          INSERT INTO users (username, email, mobile, role, password) 
          VALUES ('VyronaHub Demo Seller', 'seller@vyronahub.com', '+91-9876543210', 'seller', 'demo123')
          RETURNING id
        `);
        sellerId = newSeller.rows[0].id;
      } else {
        sellerId = sellers.rows[0].id;
      }

      await createDemoSellerData(sellerId);

      res.json({ success: true, message: "Demo seller data created", sellerId });
    } catch (error) {
      console.error('Error creating demo data:', error);
      res.status(500).json({ message: "Failed to create demo data" });
    }
  });
  
  return httpServer;
}
