import React, { createContext, useContext, useState, useCallback } from 'react';
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(getCurrentUser);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) setCurrentUser(u);
    else clearCurrentUser();
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    clearCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        isAdmin: user?.role === 'admin',
        isSupervisor: user?.role === 'supervisor',
        isCustomer: user?.role === 'customer',
        isLoggedIn: !!user,
        /** Admin has complete bypass to all resources */
        canBypassRestrictions: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
