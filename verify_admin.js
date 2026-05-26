import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[v0] Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAdmin() {
  try {
    console.log('[v0] Starting admin verification...\n');
    
    // Check admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'adminqastly@gmail.com');

    if (adminError) {
      console.error('[v0] Error fetching admin users:', adminError.message);
    } else {
      console.log('[v0] Admin Users Found:', adminUsers?.length || 0);
      if (adminUsers && adminUsers.length > 0) {
        const admin = adminUsers[0];
        console.log('\n📋 Admin Details:');
        console.log('   Email:', admin.email);
        console.log('   Role:', admin.role);
        console.log('   Status:', admin.is_active ? '✅ Active' : '❌ Inactive');
        console.log('   Permissions:', admin.permissions || 'Full Access');
        console.log('   Created:', new Date(admin.created_at).toLocaleString());
      }
    }

    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('[v0] Note: Could not access auth.users (expected with anon key)');
    } else {
      const adminAuth = authUsers?.users?.find(u => u.email === 'adminqastly@gmail.com');
      if (adminAuth) {
        console.log('\n🔐 Auth User Found:');
        console.log('   UID:', adminAuth.id);
        console.log('   Email:', adminAuth.email);
        console.log('   Email Verified:', adminAuth.email_confirmed_at ? '✅ Yes' : '❌ No');
      }
    }

    // Check audit_logs for admin activity
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('actor_email', 'adminqastly@gmail.com')
      .limit(5)
      .order('created_at', { ascending: false });

    if (!logsError && logs && logs.length > 0) {
      console.log('\n📊 Recent Admin Activity:');
      logs.forEach(log => {
        console.log(`   [${new Date(log.created_at).toLocaleString()}] ${log.action} - ${log.entity_type}`);
      });
    }

    console.log('\n✅ Verification Complete!\n');

  } catch (err) {
    console.error('[v0] Error during verification:', err.message);
  }
}

verifyAdmin();
