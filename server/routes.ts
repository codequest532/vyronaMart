import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertProductSchema, insertCartItemSchema, insertGameScoreSchema,
  insertShoppingGroupSchema, insertGroupMemberSchema, insertGroupWishlistSchema,
  insertGroupMessageSchema, insertProductShareSchema
} from "@shared/schema";
import { z } from "zod";
import { sendOTPEmail } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      // In a real app, you'd create a session/JWT here
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
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
      // For now, return null since we don't have session management
      // In a real app, you'd check the session/JWT here
      res.json(null);
    } catch (error) {
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
        libraryName: req.body.name,
        libraryType: req.body.type,
        address: req.body.address,
        contactPerson: req.body.contact,
        phone: req.body.phone || null,
        email: req.body.email || null,
        description: req.body.description || null,
      };

      // Create the request in the database
      const newRequest = await storage.createLibraryIntegrationRequest(requestData);
      res.json(newRequest);
    } catch (error) {
      console.error("Error creating library integration request:", error);
      res.status(500).json({ message: "Failed to create library integration request" });
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

      // If approved, create sample books for the library
      if (status === 'approved') {
        await storage.createLibraryBooks(parseInt(id), updatedRequest);
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating library request:", error);
      res.status(500).json({ message: "Failed to update library request" });
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

  // VyronaRead Data Organization - Authentic seller-uploaded content
  
  // E-books uploaded by sellers for VyronaRead E-Reader section (seller-specific)
  app.get("/api/vyronaread/ebooks", async (req, res) => {
    try {
      const sellerId = parseInt(req.query.sellerId as string);
      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID required" });
      }
      const eBooks = await storage.getEBooks(sellerId);
      res.json(eBooks);
    } catch (error) {
      console.error("Error fetching seller e-books:", error);
      res.status(500).json({ message: "Failed to fetch e-books" });
    }
  });

  // Physical/digital books uploaded by sellers for Browse Books section (sale/rent) (seller-specific)
  app.get("/api/vyronaread/seller-books", async (req, res) => {
    try {
      const sellerId = parseInt(req.query.sellerId as string);
      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID required" });
      }
      const allBooks = await storage.getProducts("vyronaread", "books");
      const sellerBooks = allBooks.filter((book: any) => book.sellerId === sellerId);
      res.json(sellerBooks);
    } catch (error) {
      console.error("Error fetching seller books:", error);
      res.status(500).json({ message: "Failed to fetch seller books" });
    }
  });

  // Library books from approved integrations for Library Integration section (seller-specific)
  app.get("/api/vyronaread/library-books", async (req, res) => {
    try {
      const sellerId = parseInt(req.query.sellerId as string);
      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID required" });
      }
      const allLibraryBooks = await storage.getPhysicalBooks();
      const sellerLibraryBooks = allLibraryBooks.filter((book: any) => book.sellerId === sellerId);
      res.json(sellerLibraryBooks);
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

  // VyronaSocial Group Buy Products - Seller creates group buy products
  app.post("/api/group-buy/products", async (req, res) => {
    try {
      const productData = {
        ...req.body,
        isApproved: true // Auto-approve without admin requirement
      };
      
      // Validate minimum quantity requirements
      if (productData.minQuantity < 10) {
        return res.status(400).json({ message: "Minimum quantity must be at least 10 pieces" });
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
      const campaignData = req.body;
      
      // Validate minimum requirements
      if (campaignData.targetQuantity < 5) {
        return res.status(400).json({ message: "Minimum target quantity is 5 across any seller approved products" });
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

  const httpServer = createServer(app);
  return httpServer;
}
