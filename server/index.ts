import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

// Initialize VyronaRead sample books for customer interface
async function initializeVyronaReadBooks() {
  try {
    // VyronaRead books will only be created by actual VyronaRead sellers
    // No sample books needed - platform relies on genuine seller content
    log('VyronaRead initialization skipped - books created by actual sellers only');
    return;

    // Disabled sample VyronaRead books - uncomment if needed for testing
    /*
    const vyronaReadBooks = [
      {
        name: "The Great Gatsby",
        description: "Classic American novel by F. Scott Fitzgerald",
        price: 1200, // ₹12.00
        category: "books",
        module: "vyronaread",
        imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
        metadata: {
          author: "F. Scott Fitzgerald",
          isbn: "9780743273565",
          genre: "Classic Literature",
          publisher: "Scribner",
          publicationYear: "1925",
          language: "English",
          format: "physical",
          sellerId: null,
          rentalPrice: 5,
          fixedCostPrice: 12
        }
      },
      {
        name: "To Kill a Mockingbird",
        description: "Pulitzer Prize-winning novel by Harper Lee",
        price: 1400, // ₹14.00
        category: "books",
        module: "vyronaread",
        imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
        metadata: {
          author: "Harper Lee",
          isbn: "9780061120084",
          genre: "Classic Literature",
          publisher: "J.B. Lippincott & Co.",
          publicationYear: "1960",
          language: "English",
          format: "physical",
          sellerId: null,
          rentalPrice: 6,
          fixedCostPrice: 14
        }
      },
      {
        name: "1984",
        description: "Dystopian social science fiction novel by George Orwell",
        price: 1300, // ₹13.00
        category: "books",
        module: "vyronaread",
        imageUrl: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&h=400&fit=crop",
        metadata: {
          author: "George Orwell",
          isbn: "9780451524935",
          genre: "Science Fiction",
          publisher: "Secker & Warburg",
          publicationYear: "1949",
          language: "English",
          format: "physical",
          sellerId: null,
          rentalPrice: 5,
          fixedCostPrice: 13
        }
      },
      {
        name: "Pride and Prejudice",
        description: "Romantic novel by Jane Austen",
        price: 1100, // ₹11.00
        category: "books",
        module: "vyronaread",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
        metadata: {
          author: "Jane Austen",
          isbn: "9780141439518",
          genre: "Romance",
          publisher: "T. Egerton",
          publicationYear: "1813",
          language: "English",
          format: "physical",
          sellerId: null,
          rentalPrice: 4,
          fixedCostPrice: 11
        }
      }
    ];

    // Create each book
    for (const bookData of vyronaReadBooks) {
      await storage.createProduct(bookData);
    }

    log(`VyronaRead books initialized successfully (${vyronaReadBooks.length} books created)`);
    */
  } catch (error) {
    console.error("Error initializing VyronaRead books:", error);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration using memory store (simplified for now)
const MemoryStoreSession = MemoryStore(session);

app.use(session({
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'vyrona-social-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 500) {
        logLine = logLine.slice(0, 499) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Production mode - initialize VyronaRead sample data
  log("Production mode - starting with clean database");
  
  // Initialize VyronaRead sample books for customer interface
  await initializeVyronaReadBooks();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
