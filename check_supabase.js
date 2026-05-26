import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabase() {
  console.log('[v0] Checking Supabase connection...');
  
  try {
    // Test connection
    const { data, error } = await supabase.from('admin_users').select('count').limit(1);
    
    if (error) {
      console.log('[v0] Error:', error.message);
      return false;
    }
    
    console.log('[v0] Supabase connection: ✅ SUCCESS');
    console.log('[v0] Connection established with Supabase');
    return true;
  } catch (err) {
    console.log('[v0] Connection error:', err.message);
    return false;
  }
}

checkSupabase().then(result => {
  process.exit(result ? 0 : 1);
});
