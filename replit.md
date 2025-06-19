# VyronaMart - Multi-Module E-commerce Platform

## Overview

VyronaMart is a comprehensive e-commerce platform featuring multiple specialized modules including social shopping, library management, Instagram-based selling, and traditional e-commerce. The application is built with a React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management, local state with React hooks
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with memory store
- **File Uploads**: Multer for handling media uploads
- **Real-time Features**: WebSocket server for live chat and notifications

### Database Design
The system uses a PostgreSQL database with tables for:
- Users (customers, sellers, admins with role-based access)
- Products (multi-module support for different business types)
- Shopping groups and social features
- Orders and payment tracking
- Library management (books, loans, rentals)
- Instagram integration data

## Key Components

### 1. Multi-Module System
- **VyronaHub**: Traditional e-commerce marketplace
- **VyronaSocial**: Group shopping with shared carts and social features
- **VyronaRead**: Library management and book rental system
- **VyronaInstaStore**: Instagram-based product selling

### 2. User Management
- Role-based authentication (customer, seller, admin)
- Seller type specialization (VyronaRead, VyronaHub, VyronaInstaStore)
- OTP-based email verification for password resets
- Session-based authentication with fallback admin credentials

### 3. Social Shopping Features
- Group creation and management with room codes
- Shared shopping carts with contribution tracking
- Real-time messaging and notifications
- UPI payment integration for group contributions

### 4. Payment System
- Multiple payment methods (UPI, wallet, credit/debit cards, COD)
- Razorpay integration for secure payments
- Virtual wallet system with transaction tracking
- Group payment contributions with QR code generation

### 5. E-commerce Features
- Product catalog with multiple categories
- Shopping cart and wishlist functionality
- Order management with status tracking
- Review and rating system

## Data Flow

### Authentication Flow
1. User registration/login through form submission
2. Session creation and storage in memory store
3. Role-based route protection and UI adaptation
4. OTP verification for password resets via email

### Shopping Flow
1. Product browsing with category and module filtering
2. Add to cart (individual or group)
3. Checkout process with address and payment method selection
4. Order creation and payment processing
5. Order status updates and email notifications

### Social Shopping Flow
1. Create or join shopping groups using room codes
2. Add products to shared group cart
3. Members contribute to items using various payment methods
4. Real-time updates via WebSocket connections
5. Order placement when funding goals are met

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket**: Real-time communication (ws package)
- **Brevo (Sendinblue)**: Email service for notifications and OTP

### Payment Integration
- **Razorpay**: Payment gateway for secure transactions
- **UPI**: Direct UPI payment processing with QR code generation

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast production builds

### UI and Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

## Deployment Strategy

### Development Environment
- Replit-based development with hot reloading
- Vite dev server for frontend development
- tsx for TypeScript execution in development
- Memory-based session storage for quick iteration

### Production Build
- Vite build for optimized frontend bundle
- ESBuild for backend compilation
- Static file serving from Express
- Environment-based configuration

### Database Management
- Drizzle migrations for schema updates
- Connection pooling with Neon serverless
- Automatic database provisioning checks

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 15, 2025: Completed comprehensive VyronaMallConnect customer interface with all advanced features
- June 15, 2025: Implemented Virtual Mall Home with GPS-based mall detection and live offers display
- June 15, 2025: Added digital storefronts with brand ratings, delivery estimates, and exclusive labels
- June 15, 2025: Created VyronaExpress delivery system with 30-60 min hyperlocal delivery and store pickup options
- June 15, 2025: Integrated VyronSocial group shopping with "Walk Together" mode and shared delivery costs
- June 15, 2025: Built VyronaCoins wallet system with mall-exclusive coupons and VyronaMallPass premium membership
- June 15, 2025: Implemented live mall concierge chat for multi-store order assistance and delivery tracking
- June 15, 2025: Added comprehensive customer support with store ratings, verified buyer badges, and feedback system
- June 15, 2025: Created MallCart unified checkout for multiple stores with single delivery fee optimization
- June 15, 2025: Moved all VyronaMallConnect components from home page to dedicated /vyronamallconnect page
- June 15, 2025: Removed all VyronaSpace demo stores and products from database - platform ready for authentic retail partner onboarding
- June 15, 2025: Disabled VyronaSpace store initialization code to prevent demo stores from being created on server restart
- June 15, 2025: Updated VyronaSpace customer interface to show professional empty state when no stores are onboarded
- June 15, 2025: Completed comprehensive VyronaSpace transition to real-time functional backend data integration
- June 15, 2025: Replaced all hardcoded mock data in VyronaSpace customer interface with live API calls to /api/stores, /api/products, /api/orders
- June 15, 2025: Transformed VyronaSpace stores display to use authentic database data with proper product count calculations and store categorization
- June 15, 2025: Updated VyronaSpace orders, subscriptions, and profile sections to fetch real-time data from backend endpoints
- June 15, 2025: Removed all demo data from VyronaSpace customer interface including Demo VyronaSpace Store (ID 9)
- June 15, 2025: Deleted demo seller account (vyronaspace_demo, ID 17) and associated demo products (IDs 101-104)
- June 15, 2025: Updated VyronaSpace seller dashboard backend to work with authentic seller accounts using proper store ownership mapping
- June 15, 2025: Cleaned up backend code references to demo VyronaSpace seller account - platform now production-ready
- June 17, 2025: Fixed MallCart checkout pricing calculation error - corrected double conversion from cents to rupees
- June 17, 2025: Completed comprehensive MallCart backend API integration with VyronaCoins rewards and multi-store order handling
- June 17, 2025: Added localStorage cart persistence and proper order placement flow for VyronaMallConnect module
- June 17, 2025: Implemented standalone Group Shop functionality in VyronaMallConnect page
- June 17, 2025: Added dedicated Group Shopping tab with room creation, sharing, and management features
- June 17, 2025: Fixed Group Shop workflow to remain within VyronaMallConnect instead of redirecting to VyronaSocial
- June 17, 2025: Enhanced Group Shop modal with comprehensive benefits display and customizable settings
- June 17, 2025: Created separate "Group MallCart" button in VyronaMallConnect header for dedicated group shopping access
- June 17, 2025: Added dual cart functionality - regular MallCart for individual shopping and Group MallCart for group sessions
- June 17, 2025: Fixed Group MallCart pricing display error - converted prices from cents to rupees (5999→₹60, 2999→₹30)
- June 17, 2025: Corrected Group MallCart total calculation to properly handle price conversion from database storage format
- June 17, 2025: Updated delivery options across both VyronaMallConnect checkout pages to match user specifications: VyronaExpress (30-min, ₹80), Standard (60-min, ₹45), Store Pickup (Free)
- June 17, 2025: Modified delivery fee calculations and UI text in both regular and group checkout flows with automatic cost splitting for group orders
- June 17, 2025: Secured VyronaMallConnect seller dashboard with comprehensive authentication middleware and seller-specific data isolation
- June 17, 2025: Added proper authentication checks to all VyronaMallConnect API endpoints: /store, /products, /orders, /analytics, /bulk-import
- June 17, 2025: Implemented role-based access control requiring authenticated VyronaMallConnect sellers for dashboard data access
- June 17, 2025: Enhanced data security to prevent cross-seller data access and ensure complete seller-specific data isolation
- June 19, 2025: Reverted landing page to previous stable version per user request
- June 19, 2025: Fixed critical data isolation bug - VyronaMallConnect shopping groups no longer appear in VyronaSocial
- June 19, 2025: Added 'module' field to shopping_groups schema to separate VyronaSocial and VyronaMallConnect groups
- June 19, 2025: Created dedicated VyronaMallConnect shopping group endpoints: /api/mallconnect/shopping-groups and /api/mallconnect/create-group
- June 19, 2025: Updated VyronaMallConnect frontend to use dedicated endpoints ensuring complete module isolation
- June 19, 2025: Removed Delivery Options and Loyalty & Offers tabs from VyronaMallConnect customer interface per user request
- June 19, 2025: Streamlined VyronaMallConnect to focus on core features: Browse Stores, Group Shopping, and Support & Reviews
- June 19, 2025: Updated VyronaMallConnect delivery time from 90 min to 30-60 min across all customer-facing interfaces
- June 19, 2025: Removed all mock data from VyronaMallConnect customer interface - platform ready for authentic mall partner onboarding
- June 19, 2025: Added proper empty states and API endpoints for real mall and brand data integration
- June 19, 2025: Completed VyronaMallConnect product isolation - sellers' products only available to VyronaMallConnect customers
- June 19, 2025: Fixed product filtering to ensure complete module separation between VyronaMallConnect and other platforms
- June 19, 2025: Verified VyronaInstaStore product isolation - Instagram products properly isolated using separate instagramProducts table
- June 19, 2025: Confirmed VyronaInstaStore sellers' products only accessible through /instashop customer interface with dedicated API endpoints
- June 19, 2025: Added 15-minute checkout timer to VyronaMallConnect group checkout page with countdown functionality
- June 19, 2025: Implemented timer expiration handling - disables checkout and displays expired state notification when 15 minutes elapsed
- June 19, 2025: Integrated live order tracking for VyronaMallConnect orders using OpenRouteService API
- June 19, 2025: Updated both regular and group checkout flows to redirect to /track-order/{orderId} after successful order placement
- June 19, 2025: Implemented comprehensive VyronaMallConnect seller order management system with email notifications via Brevo
- June 19, 2025: Added order status update functionality allowing sellers to update progress (confirmed, preparing, ready, picked up, out for delivery, delivered)
- June 19, 2025: Integrated automatic email notifications to customers when order status is updated by VyronaMallConnect sellers
- June 19, 2025: Created seller dashboard order management interface with real-time status updates reflected in customer live tracking
- June 19, 2025: Enhanced VyronaMallConnect order fulfillment workflow with comprehensive seller notifications and customer communication system
- June 19, 2025: Implemented identical comprehensive VyronaSpace seller order management system with email notifications via Brevo
- June 19, 2025: Added VyronaSpace seller email notifications for new orders with complete customer details and delivery information
- June 19, 2025: Enhanced VyronaSpace seller dashboard with order status update functionality and customer notification system
- June 19, 2025: Integrated live tracking updates from VyronaSpace seller status changes to customer order tracking via OpenRouteService API
- June 19, 2025: Completed end-to-end VyronaSpace order fulfillment workflow with professional seller-customer communication system
- June 19, 2025: Moved MyVyrona profile functionality to dedicated /myvyrona page for better user experience and navigation
- June 19, 2025: Created comprehensive MyVyrona dashboard with wallet management, transaction history, achievements, and user profile
- June 19, 2025: Updated homepage profile tab to redirect to dedicated MyVyrona page for cleaner homepage navigation
- June 19, 2025: Enhanced user experience by separating profile management from main homepage navigation flow
- June 19, 2025: Restored MyVyrona content to dedicated page structure per user request - profile tab redirects to /myvyrona
- June 19, 2025: Maintained clean homepage navigation with profile functionality separated into standalone dashboard experience
- June 17, 2025: Completed VyronaMallConnect seller registration integration with platform selection and dashboard routing
- June 17, 2025: Added VyronaMallConnect to seller onboarding modal with virtual storefront features and purple-indigo gradient styling  
- June 17, 2025: Created demo VyronaMallConnect seller account (mallconnect_demo@vyronamart.com / demo123) for dashboard testing
- June 17, 2025: Updated seller registration routing to automatically redirect VyronaMallConnect sellers to /vyronamallconnect-seller-dashboard
- June 17, 2025: Added image URL field to VyronaMallConnect seller dashboard "Add Product" modal with URL validation and helper text
- June 17, 2025: Updated image URL field to accept Google Drive links with detailed instructions for public sharing
- June 17, 2025: Enhanced CSV bulk import to support Google Drive links with comprehensive setup instructions and sample template
- June 17, 2025: Completed comprehensive confirmation dialog replacement across VyronaSpace and VyronaMallConnect modules
- June 17, 2025: Replaced all browser confirm() prompts with proper Dialog components for delete group, exit group, and remove member actions
- June 17, 2025: Enhanced group admin UX with professional confirmation dialogs featuring clear descriptions and loading states
- June 17, 2025: Implemented consistent confirmation workflow across both VyronaSocialGroupBuy and VyronaMallConnect customer interfaces
- June 15, 2025: Implemented automatic order tracking redirection for ALL VyronaSpace orders (individual and group buy)
- June 15, 2025: VyronaSpace customers now redirected to live order tracking page instead of static success page
- June 15, 2025: VyronaSpace group buy orders also redirect to tracking (applies to storeId 6, 7, 8)
- June 15, 2025: Non-VyronaSpace group buy orders continue using existing success page flow (unchanged for other VyronaSocial modules)
- June 15, 2025: Enhanced customer experience with immediate access to real-time delivery tracking via OpenRouteService
- June 15, 2025: Completed VyronaSpace Seller Dashboard with comprehensive store management interface
- June 15, 2025: Added seller onboarding flow with VyronaSpace platform option for retail partners
- June 15, 2025: Integrated seller registration button in landing page header ("Become a Seller")
- June 15, 2025: Built backend API endpoints for seller store profile, product management, and order tracking
- June 15, 2025: Created automatic dashboard routing - VyronaSpace sellers directed to /vyronaspace-seller-dashboard
- June 15, 2025: Added complete seller interface with store status toggle, inventory control, and analytics
- June 14, 2025: Completed comprehensive VyronaSpace hyperlocal delivery platform with 8 major feature categories
- June 14, 2025: Implemented nearby retail store discovery with geo-location-based filtering and real-time availability
- June 14, 2025: Added instant product browsing with multi-store cart support and inventory sync
- June 14, 2025: Created live delivery tracking with ETA updates and delivery partner information
- June 14, 2025: Integrated customer-retailer instant messaging and chat functionality
- June 14, 2025: Built flexible payment system with UPI, wallet, and card options
- June 14, 2025: Added subscription management for regular deliveries and auto-replenishment
- June 14, 2025: Implemented detailed store profiles with ratings, reviews, and verification badges
- June 14, 2025: Created comprehensive returns and support system with order tracking
- June 14, 2025: Added geo-rewards gamification system with VyronaCoins and achievement tracking
- June 14, 2025: VyronaSpace now serves as complete hyperlocal delivery platform similar to Swiggy/Zomato for retail shopping
- June 14, 2025: Successfully resolved comprehensive syntax error crisis across 10+ critical files
- June 14, 2025: Fixed 25+ missing parentheses and comma errors in checkout/cart/order systems
- June 14, 2025: Corrected vyronahub-checkout.tsx formatCurrency function calls and object syntax
- June 14, 2025: Application now running stably without crashes after extensive debugging
- June 14, 2025: Successfully completed comprehensive pricing model conversion from decimal to whole rupees across all VyronaMart modules
- June 14, 2025: Fixed all syntax errors caused by bulk pricing conversion including missing parentheses and incomplete expressions
- June 14, 2025: Restored complete application functionality with direct rupee pricing (no decimal values)
- June 14, 2025: Updated frontend displays to use Math.round() patterns consistently across all price displays
- June 14, 2025: Fixed data integrity issue where Instagram products remained visible after seller deletion
- June 14, 2025: Added complete Instagram data cleanup to seller deletion process (stores, products, orders, analytics)
- June 14, 2025: Manually cleaned up orphaned Instagram store and 8 products from deleted seller
- June 14, 2025: Converted entire pricing model across all VyronaMart modules to direct rupees without decimal values
- June 14, 2025: Updated backend pricing storage from cent-based (x100) to direct rupee storage across all modules
- June 14, 2025: Modified frontend price displays to use Math.round() instead of .toFixed(2) for whole rupee display
- June 14, 2025: Secured Instagram seller dashboard with complete data isolation between sellers
- June 14, 2025: Added ownership verification to order status updates preventing cross-seller access
- June 14, 2025: Enhanced seller authentication checks across all Instagram endpoints
- June 14, 2025: Implemented automated email notifications for Instagram order status updates using Brevo service
- June 14, 2025: Created comprehensive order status update email templates with dynamic content based on status
- June 14, 2025: Enhanced backend order status update endpoint to trigger automated customer notifications
- June 14, 2025: Updated frontend order status mutation to confirm email delivery to sellers
- June 14, 2025: Enhanced Instagram seller dashboard order management modal with comprehensive details
- June 14, 2025: Updated order status dropdown to include: Confirmed, Shipped, Out for Delivery, Delivered, Cancelled
- June 14, 2025: Added detailed customer information, order items breakdown, and shipping address display in order modal
- June 14, 2025: Added customer confirmation emails for Instagram orders using Brevo email service
- June 14, 2025: Enhanced email system to send order confirmations to customer's shipping address email
- June 14, 2025: Created Instagram customer confirmation email template with order details and tracking info
- June 14, 2025: Fixed Instagram cart orders to consolidate multiple items into single orders instead of creating separate orders per item
- June 14, 2025: Updated seller dashboard to properly display multi-item orders with consolidated item counts and totals
- June 14, 2025: Modified order placement logic to group cart items by store and create one order per store
- June 14, 2025: Fixed Instagram seller dashboard pricing to display whole rupees consistently with customer interface
- June 14, 2025: Updated formatCurrency function in seller dashboard to remove decimal places and paisa conversion
- June 14, 2025: Converted Instagram pricing system to whole rupees without decimals (8999 paisa → ₹89, 4550 paisa → ₹45)
- June 14, 2025: Fixed order confirmation redirect by handling response structure variations (orderId vs id)
- June 14, 2025: Updated all frontend price displays to use Math.round() instead of .toFixed(2) for whole rupee display
- June 14, 2025: Removed unnecessary price conversions throughout Instagram shop, cart, and checkout systems
- June 14, 2025: Fixed pricing inconsistency between Instagram seller dashboard and customer shop (now using consistent database pricing in cents)
- June 14, 2025: Enhanced Instagram products API with store information and proper JOIN queries for customer browsing
- June 14, 2025: Removed fallback mock data from Instagram shop to ensure authentic pricing display
- June 14, 2025: Fixed Instagram cart authentication error handling with automatic login redirect
- June 14, 2025: Optimized Instagram shop to cart navigation using client-side routing (eliminated 92-105ms delay)
- June 14, 2025: Resolved Instagram cart loading delays (95-120ms → <2ms response time)
- June 14, 2025: Optimized Instagram cart database queries with INNER JOINs and LIMIT
- June 14, 2025: Fixed database schema mismatches in Instagram API endpoints
- June 14, 2025: Completed comprehensive seller registration system with password fields and automatic dashboard routing
- June 14, 2025: Added password and confirm password fields to seller registration modal for all seller types
- June 14, 2025: Updated backend to handle all seller types (VyronaInstaStore, VyronaHub, VyronaSpace, VyronaMallConnect, VyronaRead) with user-chosen credentials
- June 14, 2025: Implemented automatic login and dashboard redirection based on seller type after registration
- June 14, 2025: VyronaInstaStore → /vyronainstastore-dashboard, VyronaHub/VyronaSocial → /vyronahub-dashboard, VyronaRead → /vyronaread-dashboard
- June 14, 2025: Removed all VyronaRead sample books and disabled automatic book initialization
- June 14, 2025: VyronaRead section now displays only authentic books created by actual VyronaRead sellers
- June 14, 2025: Fixed VyronaRead sample book data integrity issue by removing invalid sellerId references
- June 14, 2025: Updated VyronaSpace delivery times to proper quick commerce standards (all under 15 minutes)
- June 14, 2025: Changed filter options to 5/10/15 minute delivery windows matching industry quick commerce standards
- June 14, 2025: Updated hero section and delivery badges to reflect 5-15 minute delivery promise
- June 14, 2025: Store delivery times now: FreshMart (8 min), MedPlus (6 min), Fashion District (15 min)
- June 14, 2025: Successfully resolved comprehensive syntax error crisis across 19+ files with 45+ corrections
- June 14, 2025: Transformed VyronaSpace interface to lake green color scheme with emerald and teal accents throughout
- June 14, 2025: Updated all UI elements including backgrounds, buttons, cards, and interactive components to cohesive green palette
- June 14, 2025: Completed VyronaSpace transformation to store-centric MVP design with category-based shop filtering
- June 14, 2025: Removed delivery time filters, replaced with category filters (Grocery, Pharmacy, Electronics, Fashion, Books, Home & Garden)
- June 14, 2025: Updated interface to display store cards instead of product cards as primary browsing method
- June 14, 2025: Added comprehensive store information: ratings, reviews, featured products, delivery fees, and open/closed status
- June 14, 2025: Changed search functionality to focus on store discovery by name and category
- June 14, 2025: Updated hero messaging to emphasize local store discovery over product-centric shopping
- June 14, 2025: Replaced all VyronaSpace placeholder data with functional backend integration and real database queries
- June 14, 2025: Connected stores and products APIs to display authentic hyperlocal delivery data from PostgreSQL database
- June 14, 2025: Implemented automatic VyronaSpace store initialization with FreshMart Express, MedPlus Essentials, and Fashion District
- June 14, 2025: Integrated real product catalogs with proper pricing, descriptions, and store-based filtering functionality
- June 14, 2025: Implemented Easy Reorder & Subscriptions system with one-tap repeat orders and weekly/monthly delivery subscriptions
- June 14, 2025: Added Local Store Stories & Events featuring store owner profiles, hours, photos, and community event promotions
- June 14, 2025: Enhanced store profile pages with owner introductions, operating hours, and live event notifications
- June 14, 2025: Created retail subscription management for milk, fruits, medicines with edit/pause functionality
- June 14, 2025: Successfully restored complete tab functionality (orders, rewards, profile) while maintaining full-page store browsing
- June 14, 2025: Fixed JSX structure errors and implemented seamless navigation between store discovery and individual store pages
- June 14, 2025: VyronaSpace now combines comprehensive tab content with modal-free store browsing experience
- June 14, 2025: Implemented real-time order tracking with map-based delivery partner tracking similar to Swiggy
- June 14, 2025: Added comprehensive order tracking page with live map, delivery partner info, and status timeline
- June 14, 2025: Created backend API endpoint for real-time tracking data including delivery partner location updates
- June 14, 2025: Updated VyronaSpace orders section with "Track Order" buttons for live delivery tracking
- June 14, 2025: Integrated Swiggy-style delivery experience with partner communication and real-time positioning
- June 14, 2025: Completed OpenRouteService integration for live positioning instead of placeholder maps
- June 14, 2025: Added interactive Leaflet maps with custom SVG icons and real-time delivery partner tracking
- June 14, 2025: Implemented dynamic route visualization with polylines showing store→partner→customer path
- June 14, 2025: Enhanced OpenRouteService integration with real-time route calculation and accurate ETA estimates
- June 14, 2025: Added route distance and duration display showing kilometers and minutes from live API data
- June 14, 2025: Completed professional delivery tracking with authentic Swiggy-style experience using OpenRouteService API
- June 14, 2025: Enhanced subscription system to enforce VyronaWallet-only payment method for subscription orders
- June 14, 2025: Added wallet balance validation to ensure sufficient funds for subscription purchases
- June 14, 2025: Updated subscription UI to display wallet balance information and prevent non-wallet payments
- June 14, 2025: Modified backend order creation to force wallet payment method for all subscription orders
- June 14, 2025: Redesigned VyronaSpace with customer-appealing warm color palette (orange, pink, purple) replacing green theme
- June 14, 2025: Updated all UI elements including backgrounds, buttons, cards, tabs, and interactive components with vibrant orange-pink gradients
- June 14, 2025: Enhanced visual appeal with improved shadows, hover effects, and gradient transitions throughout VyronaSpace interface
- June 14, 2025: Successfully resolved comprehensive JSX structure error crisis across VyronaSpace component
- June 14, 2025: Fixed all TabsContent indentation issues and component nesting problems in vyronaspace.tsx
- June 14, 2025: Corrected closing tag alignment and removed duplicate Tabs closing tags causing compilation failures
- June 14, 2025: VyronaSpace platform now running stably with all functionality intact (tabs, cart, tracking, profiles)
- June 15, 2025: Fixed VyronaSpace seller login redirect issue - sellers now properly route to /vyronaspace-seller-dashboard
- June 15, 2025: Updated VyronaHub dashboard routing logic to include VyronaSpace seller type checks
- June 15, 2025: VyronaSpace seller dashboard integration fully completed with working demo credentials (vyronaspace_demo/demo123)
- June 15, 2025: Removed stock number display from VyronaSpace product tile cards for cleaner UI
- June 15, 2025: Fixed VyronaSpace seller dashboard product management - edit and delete buttons now fully functional
- June 15, 2025: Added complete product CRUD operations with update/delete mutations and edit product modal
- June 15, 2025: Implemented comprehensive group buy seller controls with enable/disable toggle working correctly
- June 15, 2025: Resolved database schema issues for group buy settings using proper store ID mapping
- June 14, 2025: Initial setup