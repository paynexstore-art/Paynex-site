import type { User, UserRole, Supervisor } from '@/types';
import { ADMIN_CREDENTIALS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId } from './utils';
import { logLogin } from './auditLog';
import { supabase, isSupabaseConfigured } from '@/supabaseClient.ts';
import CryptoJS from 'crypto-js';

// Constants
const AUTH_KEY = 'paynex_auth_user';
const USERS_KEY = 'paynex_users';
const SALT_KEY = 'paynex_salt_';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Simple password hashing function (note: for production use bcrypt)
function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + import.meta.env.VITE_SUPABASE_ANON_KEY).toString();
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Get current authenticated user
export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    
    const user = JSON.parse(stored) as User;
    
    // Validate user structure
    if (!user.id || !user.email || !user.role) {
      console.warn('⚠️ Invalid user structure in storage');
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error retrieving current user:', error);
    return null;
  }
}

export function setCurrentUser(user: User): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('❌ Error saving current user:', error);
  }
}

export function clearCurrentUser(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error('❌ Error clearing current user:', error);
  }
}

// Get all stored users
export function getStoredUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return [];
    
    const users = JSON.parse(stored) as User[];
    
    // Validate users
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('❌ Error retrieving stored users:', error);
    return [];
  }
}

export function saveUsers(users: User[]): void {
  try {
    if (!Array.isArray(users)) {
      console.warn('⚠️ Invalid users array provided');
      return;
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('❌ Error saving users:', error);
  }
}

// Get supervisors from local storage
function getSupervisors(): Supervisor[] {
  try {
    const stored = localStorage.getItem('paynex_supervisors');
    if (stored) {
      const supervisors = JSON.parse(stored) as Supervisor[];
      return Array.isArray(supervisors) ? supervisors : MOCK_SUPERVISORS;
    }
  } catch (err) {
    console.warn('⚠️ Failed to parse supervisors from storage:', err);
  }
  return MOCK_SUPERVISORS;
}

// Get password hashes from storage
function getPasswordHashes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem('paynex_pass_hashes') ?? '{}');
  } catch {
    return {};
  }
}

function setPasswordHash(userId: string, hash: string): void {
  try {
    const hashes = getPasswordHashes();
    hashes[userId] = hash;
    localStorage.setItem('paynex_pass_hashes', JSON.stringify(hashes));
  } catch (error) {
    console.error('❌ Error saving password hash:', error);
  }
}

// Fetch supervisors from Supabase with retry logic and better error handling
async function fetchSupervisorsFromDB(retries = 2): Promise<Array<{
  id: string;
  email: string;
  password: string;
  province: string;
  is_active: boolean;
  is_locked: boolean;
  name: string;
}> | null> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured, using localStorage');
    return null;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`🔄 Fetching supervisors from Supabase (attempt ${attempt + 1}/${retries})...`);
      
      const { data, error } = await supabase
        .from('supervisors')
        .select('id, email, password, province, is_active, is_locked, name')
        .timeout(5000); // 5 second timeout

      if (error) {
        console.error(`❌ Attempt ${attempt + 1}: Supabase error:`, {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
        continue;
      }

      if (!Array.isArray(data)) {
        console.warn('⚠️ Invalid supervisors response from database - not an array');
        return null;
      }

      console.log(`✅ Successfully fetched ${data.length} supervisors from database`);
      
      // السماح بمرور البيانات للمطابقة بشكل مرن وتجنب سقوط الحقول غير المكتملة
      return data;
    } catch (err) {
      console.error(`❌ Attempt ${attempt + 1}: Network/parsing error:`, err);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  console.warn('⚠️ Failed to fetch supervisors after retries, falling back to localStorage');
  return null;
}

// Check login attempts
function checkLoginAttempts(email: string): boolean {
  const key = `login_attempts_${email}`;
  const data = localStorage.getItem(key);
  
  if (!data) return true;

  try {
    const { count, timestamp } = JSON.parse(data);
    const elapsed = Date.now() - timestamp;

    if (elapsed > LOGIN_ATTEMPT_TIMEOUT) {
      localStorage.removeItem(key);
      return true;
    }

    if (count >= MAX_LOGIN_ATTEMPTS) {
      console.warn(`⚠️ Too many login attempts for ${email}. Try again later.`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking login attempts:', error);
  }

  return true;
}

// Record login attempt
function recordLoginAttempt(email: string): void {
  const key = `login_attempts_${email}`;
  const data = localStorage.getItem(key);

  try {
    if (!data) {
      localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: Date.now() }));
    } else {
      const parsed = JSON.parse(data);
      parsed.count += 1;
      localStorage.setItem(key, JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('❌ Error recording login attempt:', error);
  }
}

// Clear login attempts on success
function clearLoginAttempts(email: string): void {
  const key = `login_attempts_${email}`;
  localStorage.removeItem(key);
}

/**
 * Email + Password login
 * Handles admin, supervisor, and customer authentication
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: User; error?: string } | { user: null; error: string }> {
  console.log('🔐 Starting login process for:', email);
  
  // معالجة المدخلات وإزالة أي فراغات زائدة قد تحدث أثناء النسخ أو الإدخال
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPassword = password ? password.trim() : '';

  // Validate inputs
  if (!cleanEmail || !cleanEmail.includes('@')) {
    logLogin('unknown', cleanEmail, 'customer', false);
    return { user: null, error: 'بريد إلكتروني غير صحيح' };
  }

  if (!cleanPassword || cleanPassword.length < 1) {
    logLogin('unknown', cleanEmail, 'customer', false);
    return { user: null, error: 'كلمة المرور مطلوبة' };
  }

  // Check rate limiting
  if (!checkLoginAttempts(cleanEmail)) {
    logLogin('unknown', cleanEmail, 'customer', false);
    return {
      user: null,
      error: 'تم تجاوز عدد محاولات الدخول. حاول مرة أخرى لاحقاً.',
    };
  }

  try {
    // --- Super Admin ---
    console.log('👤 Checking for admin credentials...');
    if (
      cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
      cleanPassword === ADMIN_CREDENTIALS.password
    ) {
      console.log('✅ Admin login successful');
      const adminUser: User = { ...ADMIN_CREDENTIALS.user };
      setCurrentUser(adminUser);
      clearLoginAttempts(cleanEmail);
      logLogin(adminUser.id, adminUser.name, 'admin', true);
      return { user: adminUser };
    }

    // --- Supervisor (from Supabase database) ---
    console.log('👥 Attempting to fetch supervisors from Supabase...');
    const dbSupervisors = await fetchSupervisorsFromDB();
    
    if (dbSupervisors && Array.isArray(dbSupervisors)) {
      console.log(`📊 Found ${dbSupervisors.length} supervisors in database`);
      
      // البحث عن المشرف مع إزالة الفراغات وحساسية حالة الأحرف بالكامل
      const dbSupervisor = dbSupervisors.find(
        s => s.email?.trim().toLowerCase() === cleanEmail
      );

      if (dbSupervisor) {
        console.log('✅ Supervisor found in database:', dbSupervisor.name);
        
        // التحقق من حالة الحساب البرمجية مع وضع قيم افتراضية عند غياب الحقل
        const isActive = dbSupervisor.is_active ?? true;
        const isLocked = dbSupervisor.is_locked ?? false;

        if (!isActive) {
          console.warn('❌ Supervisor account is inactive');
          recordLoginAttempt(cleanEmail);
          logLogin(dbSupervisor.id, dbSupervisor.name, 'supervisor', false);
          return {
            user: null,
            error: 'تم إيقاف هذا الحساب - تواصل مع المدير العام.',
          };
        }

        if (isLocked) {
          console.warn('❌ Supervisor account is locked');
          recordLoginAttempt(cleanEmail);
          logLogin(dbSupervisor.id, dbSupervisor.name, 'supervisor', false);
          return {
            user: null,
            error: 'حسابك مقفل بسبب عدم تسليم العهدة - راجع المدير العام.',
          };
        }

        // مطابقة كلمة المرور النصية الصريحة المخزنة مباشرة في الجدول (مثل paynexb)
        const correctPassword = dbSupervisor.password ? dbSupervisor.password.trim() : '';
        console.log('🔑 Verifying password plain text matching...');
        
        if (!correctPassword || cleanPassword !== correctPassword) {
          console.error('❌ Password mismatch');
          recordLoginAttempt(cleanEmail);
          logLogin(dbSupervisor.id, dbSupervisor.name, 'supervisor', false);
          return { user: null, error: 'كلمة المرور غير صحيحة' };
        }

        console.log('✅ All validations passed - creating supervisor user');
        
        const supervisorUser: User = {
          id: dbSupervisor.id || generateId(),
          name: dbSupervisor.name || 'مشرف باينكس',
          email: dbSupervisor.email,
          role: 'supervisor',
          province: dbSupervisor.province || '',
          isActive: isActive,
          createdAt: new Date().toISOString(),
        };

        setCurrentUser(supervisorUser);
        clearLoginAttempts(cleanEmail);
        logLogin(supervisorUser.id, supervisorUser.name, 'supervisor', true);
        console.log('✅ Supervisor login successful');
        return { user: supervisorUser };
      } else {
        console.log('⚠️ Supervisor not found in Supabase database');
      }
    } else {
      console.log('⚠️ Could not fetch supervisors from Supabase');
    }

    // --- Fallback to localStorage supervisors ---
    console.log('📱 Checking localStorage for supervisors...');
    const allSupervisors = getSupervisors();
    const supervisor = allSupervisors.find(
      (s: Supervisor) => s.email.toLowerCase() === cleanEmail
    );

    if (supervisor) {
      console.log('✅ Supervisor found in localStorage:', supervisor.name);
      
      if (!supervisor.isActive) {
        recordLoginAttempt(cleanEmail);
        logLogin(supervisor.id, supervisor.name, 'supervisor', false);
        return {
          user: null,
          error: 'تم إيقاف هذا الحساب - تواصل مع المدير العام.',
        };
      }

      if (supervisor.isLocked) {
        recordLoginAttempt(cleanEmail);
        logLogin(supervisor.id, supervisor.name, 'supervisor', false);
        return {
          user: null,
          error: 'حسابك مقفل بسبب عدم تسليم العهدة - راجع المدير العام.',
        };
      }

      const passwordHashes = getPasswordHashes();
      const storedHash = passwordHashes[supervisor.id];

      if (storedHash && !verifyPassword(cleanPassword, storedHash)) {
        recordLoginAttempt(cleanEmail);
        logLogin(supervisor.id, supervisor.name, 'supervisor', false);
        return { user: null, error: 'كلمة المرور غير صحيحة' };
      }

      setCurrentUser(supervisor);
      clearLoginAttempts(cleanEmail);
      logLogin(supervisor.id, supervisor.name, 'supervisor', true);
      console.log('✅ Supervisor login successful (from localStorage)');
      return { user: supervisor };
    }

    // --- Customer (stored in localStorage) ---
    console.log('👤 Checking for customer accounts...');
    const allUsers = getStoredUsers();
    const customer = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (customer) {
      const storedHash = localStorage.getItem(`paynex_pass_hash_${customer.id}`);
      
      if (storedHash && verifyPassword(cleanPassword, storedHash)) {
        setCurrentUser(customer);
        clearLoginAttempts(cleanEmail);
        logLogin(customer.id, customer.name, 'customer', true);
        console.log('✅ Customer login successful');
        return { user: customer };
      } else {
        recordLoginAttempt(cleanEmail);
        logLogin(customer.id, customer.email, 'customer', false);
        return { user: null, error: 'كلمة المرور غير صحيحة' };
      }
    }

    // No user found
    console.log('❌ No user found with this email');
    recordLoginAttempt(cleanEmail);
    logLogin('unknown', cleanEmail, 'customer', false);
    return {
      user: null,
      error: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
    };
  } catch (error) {
    console.error('❌ Unexpected error during login:', error);
    recordLoginAttempt(cleanEmail);
    logLogin('unknown', cleanEmail, 'customer', false);
    return { user: null, error: 'حدث خطأ أثناء محاولة الدخول' };
  }
}

/**
 * User registration with validation and dual storage
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

  if (!data.password || data.password.length < 8) {
    return {
      user: null,
      error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    };
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(data.password)) {
    return {
      user: null,
      error: 'يجب أن تحتوي كلمة المرور على حروف كبيرة وصغيرة وأرقام ورموز خاصة',
    };
  }

  try {
    const allUsers = getStoredUsers();

    // Check for duplicate email in localStorage
    if (allUsers.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      logLogin('unknown', data.email, 'customer', false);
      return { user: null, error: 'البريد الإلكتروني مستخدم بالفعل' };
    }

    // Check for duplicate phone
    if (data.phone && allUsers.some(u => u.phone === data.phone)) {
      logLogin('unknown', data.phone, 'customer', false);
      return { user: null, error: 'رقم الهاتف مستخدم بالفعل' };
    }

    // Create new user with complete data
    const newUser: User = {
      id: generateId(),
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      phone: data.phone || undefined,
      role: 'customer',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
      createdAt: new Date().toISOString(),
    };

    // Hash and save password
    const passwordHash = hashPassword(data.password);
    setPasswordHash(newUser.id, passwordHash);

    // Save to localStorage
    const updated = [...allUsers, newUser];
    saveUsers(updated);

    // Attempt to save to Supabase
    if (isSupabaseConfigured()) {
      try {
        const { error: supabaseError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: newUser.id,
              full_name: newUser.name,
              email: newUser.email,
              phone: newUser.phone || null,
              national_id: null,
              created_at: newUser.createdAt,
            },
          ])
          .timeout(5000);

        if (supabaseError) {
          console.error('⚠️ Failed to save user to Supabase:', supabaseError);
        } else {
          console.log('✅ User registered in Supabase successfully');
        }
      } catch (err) {
        console.error('⚠️ Error saving user to Supabase:', err);
      }
    }

    setCurrentUser(newUser);
    logLogin(newUser.id, newUser.name, 'customer', true);
    console.log('✅ User registration successful');

    return { user: newUser };
  } catch (error) {
    console.error('❌ Unexpected error during registration:', error);
    logLogin('unknown', data.email, 'customer', false);
    return { user: null, error: 'حدث خطأ أثناء التسجيل' };
  }
}
