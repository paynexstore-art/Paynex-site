import type { User } from '@/types';
import { logLogin } from './auditLog';
import { getStoredUsers, saveUsers, setCurrentUser } from './auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client for Google OAuth
// Support both Vite (VITE_) and Next.js (NEXT_PUBLIC_) env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                        import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Use window.location.origin for the redirect URI
function getRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/google/callback`;
  }
  return '';
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

/**
 * Categorised OAuth error codes for better UX messaging.
 */
export type OAuthErrorCode =
  | 'not_configured'
  | 'popup_closed'
  | 'access_denied'
  | 'csrf_mismatch'
  | 'session_expired'
  | 'no_token'
  | 'invalid_token'
  | 'network_error'
  | 'unknown';

export interface OAuthError {
  code: OAuthErrorCode;
  message: string;
  messageAr: string;
}

function classifyGoogleError(googleErrorParam: string | null): OAuthError {
  switch (googleErrorParam) {
    case 'access_denied':
      return {
        code: 'popup_closed',
        message: 'Login cancelled - you closed the Google popup.',
        messageAr: 'تم الغاء تسجيل الدخول - اغلقت نافذة Google.',
      };
    case 'invalid_request':
    case 'unauthorized_client':
      return {
        code: 'not_configured',
        message: 'OAuth configuration error. Check your Client ID.',
        messageAr: 'خطأ في اعداد OAuth - تحقق من Client ID.',
      };
    default:
      return {
        code: 'unknown',
        message: `Google error: ${googleErrorParam}`,
        messageAr: `خطأ من Google: ${googleErrorParam}`,
      };
  }
}

/**
 * Check if Supabase is configured for Google OAuth
 */
export function isGoogleOAuthConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
}

/**
 * Initiate Google OAuth login using Supabase Auth
 */
export async function initiateGoogleLogin(): Promise<void> {
  if (!isGoogleOAuthConfigured() || !supabase) {
    throw new Error('Supabase not configured. Please check your environment variables.');
  }

  console.log('[v0] Starting Google OAuth with Supabase...');
  console.log('[v0] Redirect URI:', getRedirectUri());
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUri(),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('[v0] Supabase OAuth error:', error);
    throw new Error(error.message);
  }

  console.log('[v0] OAuth initiated, redirecting...', data);
}

/**
 * Handle Google OAuth callback using Supabase Auth
 */
export async function handleGoogleCallback(
  accessToken: string,
  state: string,
  googleErrorParam?: string | null,
): Promise<{ user: User; error?: string; oauthError?: OAuthError } | { user: null; error: string; oauthError?: OAuthError }> {
  try {
    // Handle explicit Google errors
    if (googleErrorParam) {
      const oauthError = classifyGoogleError(googleErrorParam);
      console.warn(`[v0] Google OAuth error [${oauthError.code}]:`, oauthError.message);
      return { user: null, error: oauthError.messageAr, oauthError };
    }

    if (!supabase) {
      return { 
        user: null, 
        error: 'Supabase غير مفعل',
        oauthError: { code: 'not_configured', message: 'Supabase not configured', messageAr: 'Supabase غير مفعل' }
      };
    }

    // Get session from Supabase (it handles the callback automatically)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[v0] Session error:', sessionError);
      return { 
        user: null, 
        error: 'فشل في الحصول على الجلسة',
        oauthError: { code: 'unknown', message: sessionError.message, messageAr: 'فشل في الحصول على الجلسة' }
      };
    }

    if (!session?.user) {
      // Try to exchange code for session if we have URL params
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        console.log('[v0] Exchanging code for session...');
        const { data: { session: newSession }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError || !newSession?.user) {
          console.error('[v0] Code exchange error:', exchangeError);
          return { 
            user: null, 
            error: 'فشل في تبادل الكود للجلسة',
            oauthError: { code: 'invalid_token', message: 'Code exchange failed', messageAr: 'فشل في تبادل الكود' }
          };
        }

        // Create local user from Supabase session
        const supaUser = newSession.user;
        const localUser = await createOrUpdateLocalUser(supaUser);
        
        setCurrentUser(localUser);
        logLogin(localUser.id, localUser.name, 'customer', true);
        
        console.log('[v0] Google login successful via code exchange:', localUser.email);
        return { user: localUser };
      }

      // Fallback to access token flow (for implicit grant)
      if (accessToken) {
        console.log('[v0] Using access token flow...');
        const userInfo = await getUserInfoFromGoogle(accessToken);
        if (!userInfo) {
          return { 
            user: null, 
            error: 'فشل في الحصول على بيانات المستخدم',
            oauthError: { code: 'invalid_token', message: 'Failed to get user info', messageAr: 'فشل في الحصول على بيانات المستخدم' }
          };
        }

        const localUser = createGoogleUser(userInfo);
        setCurrentUser(localUser);
        logLogin(localUser.id, localUser.name, 'customer', true);
        
        console.log('[v0] Google login successful via access token:', localUser.email);
        return { user: localUser };
      }

      return { 
        user: null, 
        error: 'لم يتم العثور على جلسة نشطة',
        oauthError: { code: 'no_token', message: 'No active session found', messageAr: 'لم يتم العثور على جلسة' }
      };
    }

    // Create local user from existing Supabase session
    const localUser = await createOrUpdateLocalUser(session.user);
    
    setCurrentUser(localUser);
    logLogin(localUser.id, localUser.name, 'customer', true);
    
    console.log('[v0] Google login successful:', localUser.email);
    return { user: localUser };

  } catch (error) {
    const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
    const err: OAuthError = {
      code: isNetworkError ? 'network_error' : 'unknown',
      message: error instanceof Error ? error.message : 'Google login failed.',
      messageAr: isNetworkError
        ? 'خطأ في الشبكة - تأكد من اتصالك بالإنترنت.'
        : 'فشل تسجيل الدخول بـ Google - يرجى المحاولة مرة أخرى.',
    };
    console.error('[v0] Google callback error:', err.message);
    return { user: null, error: err.messageAr, oauthError: err };
  }
}

/**
 * Create or update local user from Supabase user
 */
async function createOrUpdateLocalUser(supaUser: unknown): Promise<User> {
  const users = getStoredUsers();
  const existingUser = users.find(u => u.googleId === supaUser.id || u.email === supaUser.email);
  
  if (existingUser) {
    const updatedUser: User = {
      ...existingUser,
      name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || existingUser.name,
      email: supaUser.email || existingUser.email,
      avatar: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture || existingUser.avatar,
      googleId: supaUser.id,
      updatedAt: new Date().toISOString(),
    };
    
    const updatedUsers = users.map(u => u.id === existingUser.id ? updatedUser : u);
    saveUsers(updatedUsers);
    return updatedUser;
  }

  const newUser: User = {
    id: `google-${supaUser.id}`,
    name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || 'Google User',
    email: supaUser.email || '',
    role: 'customer',
    isActive: true,
    googleId: supaUser.id,
    avatar: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);
  return newUser;
}

async function getUserInfoFromGoogle(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      console.error('[v0] Google userinfo API returned:', response.status, response.statusText);
      return null;
    }
    return await response.json() as GoogleUserInfo;
  } catch (error) {
    console.error('[v0] Network error fetching Google user info:', error);
    return null;
  }
}

function createGoogleUser(googleInfo: GoogleUserInfo): User {
  const user: User = {
    id: `google-${googleInfo.id}`,
    name: googleInfo.name || 'Google User',
    email: googleInfo.email,
    role: 'customer',
    isActive: true,
    googleId: googleInfo.id,
    avatar: googleInfo.picture,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const users = getStoredUsers();
  saveUsers([...users, user]);
  return user;
}

export function getGoogleRedirectUri(): string {
  return getRedirectUri();
}
