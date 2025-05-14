// Common types
export interface UserSession {
  id: string;
  name: string;
  email: string;
  image?: string;
}

// Export constants
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN = '7d';

// Export server-side functions for server components
export {
  createToken,
  verifyToken,
  setAuthCookie,
  getAuthCookie,
  getSession,
  authenticateUser,
  registerUser,
} from './auth.server';

// Export client-side functions for client components
export {
  getClientCookie,
  getClientSession,
  isAuthenticated,
  logout,
} from './auth.client';

// Helper function to check if code is running on server or client
export const isServer = typeof window === 'undefined'; 