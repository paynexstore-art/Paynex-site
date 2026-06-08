// ============================================================
// Role & Permission Constants — Qastly Platform
// ============================================================

export const ADMIN_ROLES = ['admin', 'super_admin'] as const;
export const SUPERVISOR_ROLES = ['supervisor'] as const;
export const ALL_ROLES = [...ADMIN_ROLES, ...SUPERVISOR_ROLES, 'customer'] as const;

export const SPECIAL_ADMINS = [
  'adminqastly@gmail.com',
  'admin@qastly.com',
];

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'مدير عام - صلاحيات كاملة',
  admin: 'مسؤول النظام',
  manager: 'مدير عام الطلبات',
  supervisor: 'مشرف',
  customer: 'عميل',
};

export const ADMIN_PAGES = [
  'admin_dashboard',
  'admin_orders',
  'admin_supervisors',
  'admin_wallets',
  'admin_analytics',
  'admin_supervisor_activity',
  'admin_audit_log',
  'admin_seo',
  'admin_marketing',
  'admin_settings',
  'admin_products',
  'admin_testimonials',
];

export const PROTECTED_ROUTES = {
  admin: '/admin',
  supervisor: '/supervisor',
  customer: '/dashboard',
};
