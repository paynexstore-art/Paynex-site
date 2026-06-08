import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '@/types';
import { getCurrentUser, setCurrentUser, clearCurrentUser } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isSupervisor: boolean;
  isCustomer: boolean;
  isLoggedIn: boolean;
  /** Super Admin can bypass all restrictions */
  canBypassRestrictions: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    // Initialize from localStorage on mount
    try {
      return getCurrentUser();
    } catch (err) {
      console.error('Error initializing user from storage:', err);
      return null;
    }
  });
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = getCurrentUser();
      if (stored) {
        setUserState(stored);
      }
    } catch (err) {
      console.error('Error restoring user session:', err);
    }
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) {
      try {
        setCurrentUser(u);
      } catch (err) {
        console.error('Error saving user to storage:', err);
      }
    } else {
      try {
        clearCurrentUser();
      } catch (err) {
        console.error('Error clearing user from storage:', err);
      }
    }
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    try {
      clearCurrentUser();
    } catch (err) {
      console.error('Error during logout:', err);
    }
  }, []);

  const contextValue: AuthContextValue = {
    user,
    setUser,
    logout,
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isCustomer: user?.role === 'customer',
    isLoggedIn: !!user,
    /** Admin has complete bypass to all resources */
    canBypassRestrictions: user?.role === 'admin',
    isInitialized,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
