import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

/**
 * ProtectedRoute Component
 * 
 * Prevents unauthorized access to routes
 * - Admin: has full access everywhere
 * - Supervisor: limited to /supervisor routes
 * - Customer: limited to /my-orders and product pages
 */
export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isLoggedIn, canBypassRestrictions } = useAuth();

  // Not logged in → redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Admin can access everything (Super Admin Bypass)
  if (canBypassRestrictions) {
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
