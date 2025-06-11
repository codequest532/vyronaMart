import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      username: string;
      role: 'customer' | 'seller' | 'admin';
      sellerType?: string;
    };
  }
}