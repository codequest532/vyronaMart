import { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  email: string;
  username: string;
  role: 'customer' | 'seller' | 'admin';
  sellerType?: string; // 'vyronaread', 'vyronahub', 'vyronainstastore', etc.
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Admin credentials (fixed)
export const ADMIN_CREDENTIALS = {
  email: 'mgmags25@gmail.com',
  password: '12345678',
  id: 1,
  username: 'admin',
  role: 'admin' as const
};

// Get authenticated user from session
export function getAuthenticatedUser(req: Request): AuthenticatedUser | null {
  if (req.session?.user) {
    return req.session.user as AuthenticatedUser;
  }
  return null;
}

// Get user ID with role validation
export function getUserId(req: Request): number {
  const user = getAuthenticatedUser(req);
  return user?.id || 1; // fallback to admin if no session
}

// Check if user is admin
export function isAdmin(req: Request): boolean {
  const user = getAuthenticatedUser(req);
  return user?.role === 'admin';
}

// Check if user is seller
export function isSeller(req: Request): boolean {
  const user = getAuthenticatedUser(req);
  return user?.role === 'seller';
}

// Check if user is customer
export function isCustomer(req: Request): boolean {
  const user = getAuthenticatedUser(req);
  return user?.role === 'customer';
}

// Validate user access to room
export function canAccessRoom(req: Request, roomCreatorId: number): boolean {
  const user = getAuthenticatedUser(req);
  if (!user) return false;
  
  // Admin can access all rooms
  if (user.role === 'admin') return true;
  
  // Users can access rooms they created or are members of
  return user.id === roomCreatorId;
}

// Check if user is a VyronaRead seller
export function isVyronaReadSeller(req: Request): boolean {
  const user = getAuthenticatedUser(req);
  return user?.role === 'seller' && user?.sellerType === 'vyronaread';
}

// Check if user can access seller-specific data
export function canAccessSellerData(req: Request, sellerId: number): boolean {
  const user = getAuthenticatedUser(req);
  if (!user) return false;
  
  // Admin can access all data
  if (user.role === 'admin') return true;
  
  // Sellers can only access their own data
  return user.role === 'seller' && user.id === sellerId;
}

// Get seller ID with validation
export function getSellerIdOrFail(req: Request): number {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'seller') {
    throw new Error('Unauthorized: Seller access required');
  }
  return user.id;
}

// Log authentication info for debugging
export function logAuthInfo(req: Request, context: string): void {
  const user = getAuthenticatedUser(req);
  console.log(`${context} - Auth Info:`, {
    sessionExists: !!req.session,
    userInSession: !!req.session?.user,
    userId: user?.id,
    userRole: user?.role,
    userEmail: user?.email,
    sellerType: user?.sellerType
  });
}