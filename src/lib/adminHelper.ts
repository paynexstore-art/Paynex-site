// ============================================================
// Admin User Helper — Qastly Platform
// ============================================================

import { SPECIAL_ADMINS, ADMIN_ROLES } from '@/constants/roles';
import type { UserRoleType } from '@/types/permissions';
import { buildUserPermissions } from './rbac';

/**
 * Check if user email is a special admin
 */
export function isSpecialAdmin(email: string): boolean {
  return SPECIAL_ADMINS.includes(email.toLowerCase());
}

/**
 * Get appropriate role for a user based on email and current role
 */
export function getEffectiveRole(email: string, currentRole: string): UserRoleType {
  // Special admins always get super_admin role
  if (isSpecialAdmin(email)) {
    return 'super_admin';
  }

  // Map existing roles
  if (currentRole === 'admin') return 'admin';
  if (currentRole === 'supervisor') return 'supervisor';
  if (currentRole === 'manager') return 'manager';

  return 'customer';
}

/**
 * Grant admin access to a user
 */
export function grantAdminAccess(userId: string, email: string, userName: string) {
  const role = getEffectiveRole(email, 'admin');
  return buildUserPermissions(userId, role);
}

/**
 * Ensure admin user has all required permissions
 */
export function ensureAdminPermissions(userId: string, userName: string, email: string) {
  const role = getEffectiveRole(email, 'admin');
  const permissions = buildUserPermissions(userId, role);
  
  // Log this important action
  console.log('[v0] Admin permissions granted:', {
    userId,
    userName,
    email,
    role,
    permissionCount: permissions.permissions.length,
  });

  return permissions;
}

/**
 * Verify user has admin access before showing admin pages
 */
export function requiresAdminAccess(email: string, role: string): boolean {
  return isSpecialAdmin(email) || ADMIN_ROLES.includes(role as UserRoleType);
}
