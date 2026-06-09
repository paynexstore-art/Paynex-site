import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables with detailed error handling
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials!');
  console.error('   Required env vars:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Supabase client will not work. Check .env file.');
  }
}

let supabase: SupabaseClient;

try {
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
  );
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
  // Create a fallback client that will fail gracefully
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
}

export { supabase };

// Health check function with enhanced error handling
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Cannot test connection - missing credentials');
    return false;
  }

  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    console.log('   Response:', data ? `Retrieved ${Array.isArray(data) ? data.length : 1} record(s)` : 'No data');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection test error:', err);
    console.error('   Error type:', err instanceof Error ? err.name : typeof err);
    return false;
  }
}

// Validate Supabase connection status
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Get configuration status for debugging
export function getSupabaseStatus() {
  return {
    configured: isSupabaseConfigured(),
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET',
  };
}