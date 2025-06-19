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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for Hostinger
const MemoryStoreSession = MemoryStore(session);

app.use(session({
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'vyrona-hostinger-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const method = req.method;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Skip logging for static assets
    if (path.includes('.') && !path.includes('/api/')) {
      return;
    }
    
    log(`${method} ${path} ${status} in ${duration}ms`);
  });
  
  next();
});

async function startServer() {
  try {
    log("Hostinger production mode - starting server");
    
    // Register routes and start server
    const server = await registerRoutes(app);
    const PORT = process.env.PORT || 3000; // Hostinger typically uses port 3000
    
    server.listen(PORT, '0.0.0.0', () => {
      log(`serving on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();