// ============================================================
// Permission Types and Constants — Qastly Platform
// ============================================================

export type Permission = 
  // Orders
  | 'view_orders'
  | 'manage_orders'
  | 'accept_orders'
  | 'reject_orders'
  | 'deliver_orders'
  | 'edit_order_details'
  
  // Supervisors
  | 'view_supervisors'
  | 'manage_supervisors'
  | 'add_supervisor'
  | 'edit_supervisor'
  | 'delete_supervisor'
  | 'edit_supervisor_password'
  | 'edit_supervisor_email'
  
  // Wallets
  | 'view_wallets'
  | 'manage_wallets'
  | 'settle_wallets'
  | 'adjust_balance'
  | 'edit_wallet_settings'
  
  // Analytics
  | 'view_analytics'
  | 'view_reports'
  | 'export_analytics'
  
  // Activities
  | 'view_supervisor_activity'
  | 'view_audit_log'
  
  // SEO & Marketing
  | 'manage_seo'
  | 'manage_ads'
  | 'manage_marketing'
  | 'manage_campaigns'
  
  // Settings
  | 'manage_settings'
  | 'manage_fees'
  | 'manage_installment_settings'
  | 'manage_system_settings'
  | 'edit_admin_password'
  | 'edit_admin_email'
  
  // System
  | 'manage_system'
  | 'view_system_logs'
  | 'full_admin_access'
  | 'edit_all_data'
  | 'manage_admin_users';

export type UserRoleType = 'super_admin' | 'admin' | 'manager' | 'supervisor' | 'customer';

export interface RolePermissions {
  role: UserRoleType;
  permissions: Permission[];
  description: string;
}

export const ROLE_PERMISSIONS_MAP: Record<UserRoleType, Permission[]> = {
  super_admin: [
    // All permissions
    'full_admin_access',
    'edit_all_data',
    'manage_admin_users',
    
    // Orders
    'view_orders', 'manage_orders', 'accept_orders', 'reject_orders', 'deliver_orders', 'edit_order_details',
    
    // Supervisors
    'view_supervisors', 'manage_supervisors', 'add_supervisor', 'edit_supervisor', 'delete_supervisor', 
    'edit_supervisor_password', 'edit_supervisor_email',
    
    // Wallets
    'view_wallets', 'manage_wallets', 'settle_wallets', 'adjust_balance', 'edit_wallet_settings',
    
    // Analytics
    'view_analytics', 'view_reports', 'export_analytics',
    
    // Activities
    'view_supervisor_activity', 'view_audit_log',
    
    // SEO & Marketing
    'manage_seo', 'manage_ads', 'manage_marketing', 'manage_campaigns',
    
    // Settings
    'manage_settings', 'manage_fees', 'manage_installment_settings', 'manage_system_settings',
    'edit_admin_password', 'edit_admin_email',
    
    // System
    'manage_system', 'view_system_logs',
  ],
  admin: [
    'view_orders', 'manage_orders', 'accept_orders', 'reject_orders', 'deliver_orders', 'edit_order_details',
    'view_supervisors', 'manage_supervisors', 'add_supervisor', 'edit_supervisor', 'delete_supervisor',
    'view_wallets', 'manage_wallets', 'settle_wallets', 'adjust_balance',
    'view_analytics', 'view_reports',
    'view_supervisor_activity', 'view_audit_log',
    'manage_seo', 'manage_ads', 'manage_marketing', 'manage_campaigns',
    'manage_settings', 'manage_fees', 'manage_installment_settings',
  ],
  manager: [
    'view_orders', 'manage_orders', 'accept_orders', 'reject_orders',
    'view_supervisors',
    'view_wallets',
    'view_analytics', 'view_reports',
    'view_supervisor_activity',
  ],
  supervisor: [
    'view_orders',
    'view_wallets',
  ],
  customer: [],
};

export interface UserPermissions {
  userId: string;
  role: UserRoleType;
  customPermissions?: Permission[]; // Override/additional permissions
  permissions: Permission[];
  grantedAt: string;
  grantedBy?: string;
}

export interface PageAccessControl {
  page: string;
  requiredPermissions: Permission[];
  allowedRoles: UserRoleType[];
}

export const PAGE_ACCESS_CONTROL: Record<string, PageAccessControl> = {
  admin_dashboard: {
    page: 'admin_dashboard',
    requiredPermissions: ['view_orders', 'view_supervisors', 'view_analytics'],
    allowedRoles: ['super_admin', 'admin', 'manager'],
  },
  admin_orders: {
    page: 'admin_orders',
    requiredPermissions: ['view_orders'],
    allowedRoles: ['super_admin', 'admin', 'manager'],
  },
  admin_supervisors: {
    page: 'admin_supervisors',
    requiredPermissions: ['view_supervisors'],
    allowedRoles: ['super_admin', 'admin'],
  },
  admin_wallets: {
    page: 'admin_wallets',
    requiredPermissions: ['view_wallets'],
    allowedRoles: ['super_admin', 'admin'],
  },
  admin_analytics: {
    page: 'admin_analytics',
    requiredPermissions: ['view_analytics'],
    allowedRoles: ['super_admin', 'admin', 'manager'],
  },
  admin_supervisor_activity: {
    page: 'admin_supervisor_activity',
    requiredPermissions: ['view_supervisor_activity'],
    allowedRoles: ['super_admin', 'admin'],
  },
  admin_audit_log: {
    page: 'admin_audit_log',
    requiredPermissions: ['view_audit_log'],
    allowedRoles: ['super_admin', 'admin'],
  },
  admin_seo: {
    page: 'admin_seo',
    requiredPermissions: ['manage_seo', 'manage_ads'],
    allowedRoles: ['super_admin', 'admin'],
  },
  admin_marketing: {
    page: 'admin_marketing',
    requiredPermissions: ['manage_marketing', 'manage_campaigns'],
    allowedRoles: ['super_admin', 'admin'],
  },
  admin_settings: {
    page: 'admin_settings',
    requiredPermissions: ['manage_settings'],
    allowedRoles: ['super_admin', 'admin'],
  },
};
