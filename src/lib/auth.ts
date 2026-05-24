import type { User, UserRole, Supervisor } from '@/types';
import { ADMIN_CREDENTIALS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId } from './utils';
import { logLogin } from './auditLog';

const AUTH_KEY   = 'qastly_auth_user';
const USERS_KEY  = 'qastly_users';

export function getCurrentUser(): User | null {
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  try { return JSON.parse(stored) as User; } catch { return null; }
}
export function setCurrentUser(user: User): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}
export function clearCurrentUser(): void {
  localStorage.removeItem(AUTH_KEY);
}
export function getStoredUsers(): User[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored) as User[]; } catch { return []; }
}
export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSupervisors(): Supervisor[] {
  try {
    // Must match KEY.supervisors in storage.ts ('paynix_supervisors')
    const stored = localStorage.getItem('paynix_supervisors');
    if (stored) return JSON.parse(stored) as Supervisor[];
  } catch (err) {
    console.warn('Failed to parse supervisors from storage:', err);
  }
  return MOCK_SUPERVISORS;
}
function getPasswords(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('qastly_sup_passwords') ?? '{}'); } catch { return {}; }
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

  // ——— Supervisor (dynamic credentials managed by admin) ———
  const allSupervisors = getSupervisors();
  const supervisor = allSupervisors.find(
    (s: Supervisor) => s.email.toLowerCase() === email.toLowerCase()
  );
  if (supervisor) {
    if (!supervisor.isActive) {
      logLogin(supervisor.id, supervisor.name, 'supervisor', false);
      return { user: null, error: 'تم إيقاف هذا الحساب — تواصل مع المدير العام.' };
    }
    if (supervisor.isLocked) {
      logLogin(supervisor.id, supervisor.name, 'supervisor', false);
      return {
        user: null,
        error: 'حسابك مقفل بسبب عدم تسليم العهدة — راجع المدير العام لفتح الحساب.',
      };
    }
    const passwords = getPasswords();
    const storedPass = passwords[supervisor.id];
    // Accept stored password OR default "000000"
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
  const storedPass = localStorage.getItem(`qastly_pass_${user.id}`);
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
  if (otp !== '1234') {
    logLogin(`phone:${phone}`, phone, 'customer', false);
    return { user: null, error: 'رمز التحقق غير صحيح (استخدم 1234 للتجربة)' };
  }
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
  localStorage.setItem(`qastly_pass_${user.id}`, data.password);
  saveUsers([...users, user]);
  setCurrentUser(user);
  return { user };
}

/** Mock Google OAuth login (demo only — replaced by real OAuth when configured) */
export function mockGoogleLogin(): User {
  const uid = generateId();
  const googleUser: User = {
    id: `google-${uid}`,
    name: 'مستخدم Google',
    email: `user.${Date.now()}@gmail.com`,
    role: 'customer',
    isActive: true,
    googleId: uid,
    avatar: `https://ui-avatars.com/api/?name=Google+User&background=0f2460&color=fff`,
    createdAt: new Date().toISOString(),
  };
  const users = getStoredUsers();
  saveUsers([...users, googleUser]);
  setCurrentUser(googleUser);
  return googleUser;
}

export const isAdmin      = (u: User | null) => u?.role === 'admin';
export const isSupervisor = (u: User | null) => u?.role === 'supervisor';
export const isCustomer   = (u: User | null) => u?.role === 'customer';
