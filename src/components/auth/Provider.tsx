'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getClientSession } from '@/lib/auth.client';
import { UserSession } from '@/lib/auth';

// Create auth context
interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on client-side
    const session = getClientSession();
    setUser(session);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 