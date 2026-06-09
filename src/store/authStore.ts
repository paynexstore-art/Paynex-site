import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'supervisor' | 'customer';
  fullName: string;
  governorate?: string;
  is_locked?: boolean;
}

interface AuthState {
  user: User | null;
  session: any | null;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      logout: () => set({ user: null, session: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
