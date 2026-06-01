import type { User } from '@/types';
import { ADMIN_CREDENTIALS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId } from './utils';
import { logLogin } from './auditLog';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// ─── Super Admin permission matrix ───────────────────────────────────────────
export type AdminPermission =
  | 'manage_users' | 'manage_supervisors' | 'manage_products' | 'manage_orders'
  | 'manage_wallets' | 'manage_salary' | 'manage_settings' | 'approve_orders'
  | 'reject_orders' | 'view_audit_logs' | 'manage_coupons' | 'manage_testimonials'
  | 'lock_unlock_supervisors' | 'settle_wallet_debt' | 'approve_salary'
  | 'manage_rls' | 'database_admin' | 'export_data' | 'import_data' | 'manage_integrations';

export interface AdminRole {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  permissions: Record<AdminPermission, boolean>;
  isActive: boolean;
}

// Default Super Admin — hardcoded fallback, DB is source of truth
const SUPER_ADMIN_PERMISSIONS: Record<AdminPermission, boolean> = {
  manage_users: true, manage_supervisors: true, manage_products: true,
  manage_orders: true, manage_wallets: true, manage_salary: true,
  manage_settings: true, approve_orders: true, reject_orders: true,
  view_audit_logs: true, manage_coupons: true, manage_testimonials: true,
  lock_unlock_supervisors: true, settle_wallet_debt: true, approve_salary: true,
  manage_rls: true, database_admin: true, export_data: true,
  import_data: true, manage_integrations: true,
};

/** Fetch admin role + permissions from Supabase */
export async function fetchAdminRole(userId: string): Promise<AdminRole | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('admin_roles').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  return {
    userId:      data.user_id,
    email:       data.email,
    name:        data.name,
    role:        data.role,
    permissions: data.permissions as Record<AdminPermission, boolean>,
    isActive:    data.is_active,
  };
}

/** Check if admin has a specific permission */
export function hasPermission(adminRole: AdminRole | null, permission: AdminPermission): boolean {
  if (!adminRole) return false;
  if (adminRole.role === 'super_admin') return true; // Super Admin bypasses all checks
  return adminRole.permissions?.[permission] === true;
}

/** Check if current user is Super Admin */
export function isSuperAdmin(user: User | null, adminRole?: AdminRole | null): boolean {
  if (!user || user.role !== 'admin') return false;
  if (adminRole) return adminRole.role === 'super_admin';
  // Fallback: check hardcoded credential
  return user.id === ADMIN_CREDENTIALS.user.id;
}

const AUTH_KEY   = 'paynexsmart_auth_user';
const USERS_KEY  = 'paynexsmart_users';

export function getCurrentUser(): User | null {
  // Support both old and new key names for backwards-compatibility
  const stored = localStorage.getItem(AUTH_KEY) ?? localStorage.getItem('paynexsmart_auth_user');
  if (!stored) return null;
  try { return JSON.parse(stored) as User; } catch { return null; }
}
export function setCurrentUser(user: User): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}
export function clearCurrentUser(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('paynexsmart_auth_user');
}
export function getStoredUsers(): User[] {
  const stored = localStorage.getItem(USERS_KEY) ?? localStorage.getItem('paynexsmart_users') ?? '[]';
  try { return JSON.parse(stored) as User[]; } catch { return []; }
}
export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSupervisors() {
  try {
    const stored = localStorage.getItem('paynexsmart_supervisors') ?? localStorage.getItem('paynexsmart_supervisors');
    if (stored) return JSON.parse(stored);
  } catch {}
  return MOCK_SUPERVISORS;
}

function getPasswords(): Record<string, string> {
  try {
    return JSON.parse(
      localStorage.getItem('paynexsmart_sup_passwords') ??
      localStorage.getItem('paynexsmart_sup_passwords') ??
      '{}'
    );
  } catch { return {}; }
}

/**
 * Email + Password login — handles admin, supervisor, and customer.
 */
export function loginWithEmail(
  email: string,
  password: string
): { user: User; error?: string } | { user: null; error: string } {

  // ——— Super Admin ———
  if (
    email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const adminUser: User = { ...ADMIN_CREDENTIALS.user };
    setCurrentUser(adminUser);
    logLogin(adminUser.id, adminUser.name, 'admin', true);
    return { user: adminUser };
  }

  // ——— Supervisor ———
  const allSupervisors = getSupervisors();
  const supervisor = allSupervisors.find(
    (s: any) => s.email.toLowerCase() === email.toLowerCase()
  );
  if (supervisor) {
    if (!supervisor.isActive) {
      logLogin(supervisor.id, supervisor.name, 'supervisor', false);
      return { user: null, error: 'تم إيقاف هذا الحساب — تواصل مع المدير العام.' };
    }
    if (supervisor.isLocked) {
      logLogin(supervisor.id, supervisor.name, 'supervisor', false);
      return { user: null, error: 'حسابك مقفل بسبب عدم تسليم العهدة — راجع المدير العام لفتح الحساب.' };
    }
    const passwords = getPasswords();
    const storedPass = passwords[supervisor.id];
    if (password === (storedPass ?? '000000') || (!storedPass && password === '000000')) {
      setCurrentUser(supervisor);
      logLogin(supervisor.id, supervisor.name, 'supervisor', true);
      return { user: supervisor };
    }
    logLogin(supervisor.id, supervisor.name, 'supervisor', false);
    return { user: null, error: 'كلمة المرور غير صحيحة' };
  }

  // ——— Customer ———
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { user: null, error: 'البريد الإلكتروني غير مسجل' };
  }
  // Check both old and new key patterns
  const storedPass =
    localStorage.getItem(`paynexsmart_pass_${user.id}`) ??
    localStorage.getItem(`paynexsmart_pass_${user.id}`);
  if (storedPass !== password) {
    logLogin(user.id, user.name, 'customer', false);
    return { user: null, error: 'كلمة المرور غير صحيحة' };
  }
  setCurrentUser(user);
  logLogin(user.id, user.name, 'customer', true);
  return { user };
}

/**
 * Phone + OTP login (mock: OTP always 1234 in demo).
 */
export function loginWithPhone(
  phone: string,
  otp: string
): { user: User; error?: string } | { user: null; error: string } {
  if (otp !== '1234') return { user: null, error: 'رمز التحقق غير صحيح (استخدم 1234 للتجربة)' };
  const users = getStoredUsers();
  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = {
      id: generateId(),
      name: `مستخدم ${phone.slice(-4)}`,
      email: '',
      phone,
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, user]);
  }
  setCurrentUser(user);
  return { user };
}

/**
 * New customer registration.
 */
export function registerUser(data: {
  name: string; email: string; phone: string; password: string;
}): { user: User; error?: string } | { user: null; error: string } {
  const users = getStoredUsers();
  if (users.find(u => u.email === data.email)) {
    return { user: null, error: 'البريد الإلكتروني مستخدم بالفعل' };
  }
  const user: User = {
    id: generateId(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: 'customer',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(`paynexsmart_pass_${user.id}`, data.password);
  saveUsers([...users, user]);
  setCurrentUser(user);
  return { user };
}

/** Mock Google OAuth login */
export function mockGoogleLogin(): User {
  const googleUser: User = {
    id: `google-${generateId()}`,
    name: 'مستخدم Google',
    email: `user.${Date.now()}@gmail.com`,
    role: 'customer',
    isActive: true,
    googleId: `google-${generateId()}`,
    avatar: `https://ui-avatars.com/api/?name=Google+User&background=0a1628&color=fff`,
    createdAt: new Date().toISOString(),
  };
  const users = getStoredUsers();
  saveUsers([...users, googleUser]);
  setCurrentUser(googleUser);
  return googleUser;
}

export const isAdmin          = (u: User | null) => u?.role === 'admin';
export const isSuperAdminUser = (u: User | null) => u?.role === 'admin' && u?.id === ADMIN_CREDENTIALS.user.id;
export const isSupervisor     = (u: User | null) => u?.role === 'supervisor';
export const isCustomer       = (u: User | null) => u?.role === 'customer';
