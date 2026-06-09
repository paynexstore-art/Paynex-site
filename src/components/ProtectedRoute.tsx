import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

/**
 * ProtectedRoute Component
 *
 * Prevents unauthorized access to routes.
 * Falls back to localStorage if React state hasn't synced yet (race-condition fix).
 * - Admin: has full access everywhere
 * - Supervisor: limited to /supervisor routes
 * - Customer: limited to /my-orders and product pages
 */
export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user: ctxUser, isLoggedIn, canBypassRestrictions } = useAuth();

  // Race-condition fix: read localStorage as fallback so we never redirect
  // back to login just because React state hasn't updated yet.
  const user = ctxUser ?? getCurrentUser();
  const loggedIn = !!user;
  const isAdminRole = user?.role === 'admin';

  // Not logged in → redirect to login
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Admin can access everything (Super Admin Bypass)
  if (isAdminRole) {
    return <>{children}</>;
  }

  // Check role-based access
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (user && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
