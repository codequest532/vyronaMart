import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { storage } from "./storage";

const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  console.log(`${timestamp} AM [express] ${message}`);
};

async function initializeVyronaReadData() {
  try {
    /* 
    VyronaRead initialization disabled - books created by actual sellers only
    
    const vyronaReadBooks = [
      {
        name: "To Kill a Mockingbird",
        description: "Classic American literature by Harper Lee",
        price: 1400, // ₹14.00
        category: "books",
        module: "vyronaread",
        imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
        metadata: {
          author: "Harper Lee",
          isbn: "9780061120084",
          genre: "Fiction",
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

async function initializeVyronaSpaceData() {
  // VyronaSpace initialization disabled - no demo stores created
  // Stores will be added when actual retail partners are onboarded
  log("VyronaSpace initialization skipped - stores created by onboarded partners only");
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
  const method = req.method;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Skip logging for common static assets
    if (path.includes('.') && !path.includes('/api/')) {
      return;
    }
    
    let responseInfo = '';
    if (method === 'GET' && path.startsWith('/api/') && status === 200) {
      // For GET requests that return data, show a preview
      const originalSend = res.send;
      res.send = function(data) {
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              responseInfo = ` :: ${data.substring(0, 200)}${data.length > 200 ? '…' : ''}`;
            }
          } catch (e) {
            // Not JSON, skip preview
          }
        }
        return originalSend.call(this, data);
      };
    }
    
    log(`${method} ${path} ${status} in ${duration}ms${responseInfo}`);
  });
  
  next();
});

async function startServer() {
  try {
    log("Production mode - starting with clean database");
    
    // Initialize data
    log("VyronaRead initialization skipped - books created by actual sellers only");
    await initializeVyronaSpaceData();
    
    // Register routes and start server
    const server = await registerRoutes(app);
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, '0.0.0.0', () => {
      log(`serving on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();