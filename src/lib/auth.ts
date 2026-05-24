import type { User, UserRole, Supervisor } from '@/types';
import { ADMIN_CREDENTIALS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId } from './utils';
import { logLogin } from './auditLog';

const AUTH_KEY   = 'paynex_auth_user';
const USERS_KEY  = 'paynex_users';

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
    // Must match KEY.supervisors in storage.ts ('paynex_supervisors')
    const stored = localStorage.getItem('paynex_supervisors');
    if (stored) return JSON.parse(stored) as Supervisor[];
  } catch (err) {
    console.warn('Failed to parse supervisors from storage:', err);
  }
  return MOCK_SUPERVISORS;
}
function getPasswords(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('paynex_sup_passwords') ?? '{}'); } catch { return {}; }
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
  }

  // ——— Customer (stored in localStorage by registration) ———
  const allUsers = getStoredUsers();
  const customer = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (customer) {
    const storedHash = localStorage.getItem(`paynex_pass_${customer.id}`);
    if (storedHash === password) {
      setCurrentUser(customer);
      logLogin(customer.id, customer.name, 'customer', true);
      return { user: customer };
    }
  }

  logLogin('unknown', email, 'customer', false);
  return { user: null, error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' };
}

/**
 * User registration — validates inputs and creates customer account
 */
export function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): { user: User; error?: string } | { user: null; error: string } {

  // Validate inputs
  if (!data.name?.trim()) {
    return { user: null, error: 'الاسم مطلوب' };
  }

  if (!data.email || !data.email.includes('@')) {
    return { user: null, error: 'بريد إلكتروني غير صحيح' };
  }

  if (!data.password || data.password.length < 6) {
    return { user: null, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
  }

  const allUsers = getStoredUsers();

  // Check for duplicate email
  if (allUsers.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    logLogin('unknown', data.email, 'customer', false);
    return { user: null, error: 'البريد الإلكتروني مستخدم بالفعل' };
  }

  // Check for duplicate phone (if provided)
  if (data.phone && allUsers.some(u => u.phone === data.phone)) {
    logLogin('unknown', data.phone, 'customer', false);
    return { user: null, error: 'رقم الهاتف مستخدم بالفعل' };
  }

  // Create new user
  const newUser: User = {
    id: generateId(),
    name: data.name.trim(),
    email: data.email.toLowerCase(),
    phone: data.phone || undefined,
    role: 'customer',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
  };

  // Save user and password
  const updated = [...allUsers, newUser];
  saveUsers(updated);
  localStorage.setItem(`paynex_pass_${newUser.id}`, data.password);

  setCurrentUser(newUser);
  logLogin(newUser.id, newUser.name, 'customer', true);

  return { user: newUser };
}
