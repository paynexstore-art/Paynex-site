import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials!');
  console.error('   Required env vars:');
  console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   - VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Supabase client will not work. Check .env file.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Health check function
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection test error:', err);
    return false;
  }
}
