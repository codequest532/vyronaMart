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
- June 14, 2025. Initial setup