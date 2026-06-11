import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function activateAccounts() {
  console.log('🚀 Starting account activation process...');

  try {
    // 1. Activate Admin Users
    console.log('Updating admin users...');
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'admin');

    if (adminError) throw adminError;

    for (const admin of admins || []) {
      const { error } = await supabase
        .from('users')
        .update({ is_active: true, is_locked: false })
        .eq('id', admin.id);
      if (error) console.error(`❌ Failed to activate admin ${admin.email}:`, error.message);
      else console.log(`✅ Activated admin: ${admin.email}`);
    }

    // 2. Activate Supervisors
    console.log('Updating supervisors...');
    const { data: supervisors, error: supError } = await supabase
      .from('supervisors')
      .select('id, email')
      .eq('is_active', false);

    if (supError) throw supError;

    if (!supervisors || supervisors.length === 0) {
      console.log('No inactive supervisors found.');
    } else {
      for (const sup of supervisors) {
        const { error } = await supabase
          .from('supervisors')
          .update({ is_active: true, is_locked: false })
          .eq('id', sup.id);
        if (error) console.error(`❌ Failed to activate supervisor ${sup.email}:`, error.message);
        else console.log(`✅ Activated supervisor: ${sup.email}`);
      }
    }

    console.log('✨ All target accounts have been processed.');
  } catch (err: any) {
    console.error('💥 Critical error during activation:', err.message);
    process.exit(1);
  }
}

activateAccounts();
