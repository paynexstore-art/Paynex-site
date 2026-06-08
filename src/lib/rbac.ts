// ============================================================
// RBAC (Role-Based Access Control) — PayNex Platform
// ============================================================

import { UserRoleType, Permission, ROLE_PERMISSIONS_MAP, PAGE_ACCESS_CONTROL, UserPermissions } from '@/types/permissions';

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: Permission[], permission: Permission): boolean {
  return userPermissions.includes(permission) || userPermissions.includes('*' as Permission);
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRoleType): Permission[] {
  return ROLE_PERMISSIONS_MAP[role] || [];
}

/**
 * Check if user can access a specific page
 */
export function canAccessPage(userRole: UserRoleType, pageKey: string): boolean {
  const pageAccess = PAGE_ACCESS_CONTROL[pageKey as keyof typeof PAGE_ACCESS_CONTROL];
  if (!pageAccess) return false;
  
  return pageAccess.allowedRoles.includes(userRole);
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
  userPermissions: Permission[],
  action: Permission
): boolean {
  return hasPermission(userPermissions, action);
}

/**
 * Build user permissions object from role
 */
export function buildUserPermissions(
  userId: string,
  role: UserRoleType,
  customPermissions?: Permission[]
): UserPermissions {
  const rolePermissions = getRolePermissions(role);
  const allPermissions = customPermissions 
    ? [...new Set([...rolePermissions, ...customPermissions])]
    : rolePermissions;

  return {
    userId,
    role,
    customPermissions,
    permissions: allPermissions,
    grantedAt: new Date().toISOString(),
  };
}

/**
 * Filter user list by permission (for authorization checks)
 */
export function filterByPermission<T extends { role: UserRoleType }>(
  items: T[],
  requiredRole: UserRoleType
): T[] {
  return items.filter(item => {
    const permissions = getRolePermissions(item.role);
    const requiredPermissions = getRolePermissions(requiredRole);
    return hasAllPermissions(permissions, requiredPermissions);
  });
}

/**
 * Check if role is higher or equal in hierarchy
 */
export function isRoleHigherOrEqual(userRole: UserRoleType, requiredRole: UserRoleType): boolean {
  const roleHierarchy: Record<UserRoleType, number> = {
    super_admin: 5,
    admin: 4,
    manager: 3,
    supervisor: 2,
    customer: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Merge multiple permission sets
 */
export function mergePermissions(...permissionSets: Permission[][]): Permission[] {
  return [...new Set(permissionSets.flat())];
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(role: UserRoleType): boolean {
  return role === 'super_admin';
}

/**
 * Check if user is admin or higher
 */
export function isAdmin(role: UserRoleType): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user is manager or higher
 */
export function isManager(role: UserRoleType): boolean {
  return role === 'manager' || isAdmin(role);
}

/**
 * Get page access info
 */
export function getPageAccessInfo(pageKey: string) {
  return PAGE_ACCESS_CONTROL[pageKey as keyof typeof PAGE_ACCESS_CONTROL];
}

/**
 * Check if user can access and perform action on page
 */
export function canAccessPageAndPerform(
  userRole: UserRoleType,
  userPermissions: Permission[],
  pageKey: string,
  action?: Permission
): boolean {
  if (!canAccessPage(userRole, pageKey)) return false;
  
  if (action) {
    return hasPermission(userPermissions, action);
  }
  
  return true;
}
