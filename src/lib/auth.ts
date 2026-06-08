import type { User, UserRole, Supervisor } from '@/types';
import { ADMIN_CREDENTIALS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId } from './utils';
import { logLogin } from './auditLog';
import { createClient } from '@supabase/supabase-js';

// Supabase client - created locally, no external imports
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    // Must match KEY.supervisors in storage.ts ('qastly_supervisors')
    const stored = localStorage.getItem('qastly_supervisors');
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
 * Fetch supervisors from Supabase
 */
async function fetchSupervisorsFromDB(): Promise<Array<{id: string; email: string; password: string; province: string; is_active: boolean; is_locked: boolean; name: string}> | null> {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('id, email, password, province, is_active, is_locked, name');
    if (error) {
      console.error('Error fetching supervisors:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to fetch supervisors:', err);
    return null;
  }
}

/**
 * Email + Password login — handles admin, supervisor, and customer.
 * Now checks supervisors from Supabase database
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: User; error?: string } | { user: null; error: string }> {

  // --- Super Admin ---
  if (
    email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const adminUser: User = { ...ADMIN_CREDENTIALS.user };
    setCurrentUser(adminUser);
    logLogin(adminUser.id, adminUser.name, 'admin', true);
    return { user: adminUser };
  }

  // --- Supervisor (from Supabase database) ---
  const dbSupervisors = await fetchSupervisorsFromDB();
  if (dbSupervisors) {
    const dbSupervisor = dbSupervisors.find(
      s => s.email?.toLowerCase() === email.toLowerCase()
    );
    if (dbSupervisor) {
      if (!dbSupervisor.is_active) {
        logLogin(dbSupervisor.id, dbSupervisor.name, 'supervisor', false);
        return { user: null, error: 'تم إيقاف هذا الحساب - تواصل مع المدير العام.' };
      }
      if (dbSupervisor.is_locked) {
        logLogin(dbSupervisor.id, dbSupervisor.name, 'supervisor', false);
        return {
          user: null,
          error: 'حسابك مقفل بسبب عدم تسليم العهدة - راجع المدير العام لفتح الحساب.',
        };
      }
      // Check password from database (default to '000000')
      const correctPassword = dbSupervisor.password || '000000';
      if (password === correctPassword) {
        const supervisorUser: User = {
          id: dbSupervisor.id,
          name: dbSupervisor.name,
          email: dbSupervisor.email,
          role: 'supervisor',
          province: dbSupervisor.province,
          isActive: dbSupervisor.is_active,
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(supervisorUser);
        logLogin(supervisorUser.id, supervisorUser.name, 'supervisor', true);
        return { user: supervisorUser };
      } else {
        logLogin(dbSupervisor.id, dbSupervisor.name, 'supervisor', false);
        return { user: null, error: 'كلمة المرور غير صحيحة' };
      }
    }
  }

  // Fallback to localStorage supervisors if DB fetch fails
  const allSupervisors = getSupervisors();
  const supervisor = allSupervisors.find(
    (s: Supervisor) => s.email.toLowerCase() === email.toLowerCase()
  );
  if (supervisor) {
    if (!supervisor.isActive) {
      logLogin(supervisor.id, supervisor.name, 'supervisor', false);
      return { user: null, error: 'تم إيقاف هذا الحساب - تواصل مع المدير العام.' };
    }
    if (supervisor.isLocked) {
      logLogin(supervisor.id, supervisor.name, 'supervisor', false);
      return {
        user: null,
        error: 'حسابك مقفل بسبب عدم تسليم العهدة - راجع المدير العام لفتح الحساب.',
      };
    }
    const passwords = getPasswords();
    const storedPass = passwords[supervisor.id];
    // Accept stored password OR default "000000"
    if (password === (storedPass ?? '000000') || password === '000000') {
      setCurrentUser(supervisor);
      logLogin(supervisor.id, supervisor.name, 'supervisor', true);
      return { user: supervisor };
    }
  }

  // --- Customer (stored in localStorage by registration) ---
  const allUsers = getStoredUsers();
  const customer = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (customer) {
    const storedHash = localStorage.getItem(`qastly_pass_${customer.id}`);
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
 * Now saves to BOTH localStorage (for session) AND Supabase (for persistence)
 */
export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user: User; error?: string } | { user: null; error: string }> {

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

  // Check for duplicate email in localStorage
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

  // Save to localStorage for session
  const updated = [...allUsers, newUser];
  saveUsers(updated);
  localStorage.setItem(`qastly_pass_${newUser.id}`, data.password);

  // Save to Supabase for persistence
  try {
    const { error: supabaseError } = await supabase
      .from('user_profiles')
      .insert([{
        full_name: newUser.name,
        phone: newUser.phone || null,
        national_id: null,
      }]);

    if (supabaseError) {
      console.error('Supabase registration error:', supabaseError);
      // Don't fail the registration - localStorage already has the user
    } else {
      console.log('User registered in Supabase successfully');
    }
  } catch (err) {
    console.error('Failed to save user to Supabase:', err);
  }

  setCurrentUser(newUser);
  logLogin(newUser.id, newUser.name, 'customer', true);

  return { user: newUser };
}
