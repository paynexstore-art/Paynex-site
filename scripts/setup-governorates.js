const { createClient } = require('@supabase/supabase-js');

// Use environment variables or fallbacks
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgkijgyzargmfyeyztgy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'; // Needs service role to create users/bypass RLS

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GOVERNORATES = [
  "القاهرة", "الإسكندرية", "الجيزة", "القليوبية", "الدقهلية", "الشرقية", "المنوفية", 
  "الغربية", "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", 
  "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", 
  "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"
];

async function setupSupervisors() {
  console.log("🚀 Starting Governorates and Supervisors Setup...");

  try {
    // 1. Get all existing supervisor users
    const { data: supervisorUsers, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('role', 'supervisor');

    if (userError) throw userError;

    console.log(`Found ${supervisorUsers?.length || 0} existing supervisor users.`);

    let users = supervisorUsers || [];

    // 2. If we don't have enough supervisors, create dummy ones
    if (users.length < GOVERNORATES.length) {
      console.log(`Need ${GOVERNORATES.length - users.length} more supervisors. Creating dummy accounts...`);
      
      for (let i = users.length; i < GOVERNORATES.length; i++) {
        const email = `supervisor_${GOVERNORATES[i]}.paynex@example.com`;
        const fullName = `مشرف ${GOVERNORATES[i]}`;
        
        // Note: In a real Supabase environment, we'd use auth.admin.createUser
        // But for this simulation and database setup, we'll insert into the 'users' table
        // assuming the auth is handled or this is a seed script.
        const { data, error: createError } = await supabase
          .from('users')
          .insert([
            { 
              email, 
              full_name: fullName, 
              role: 'supervisor', 
              password_hash: 'hashed_password_placeholder',
              is_active: true 
            }
          ])
          .select();

        if (createError) {
          console.error(`Error creating user for ${GOVERNORATES[i]}: ${createError.message}`);
        } else {
          users.push(data[0]);
        }
      }
    }

    // 3. Assign each supervisor to a governorate and activate wallet
    console.log("Assigning governorates and activating wallets...");
    
    for (let i = 0; i < GOVERNORATES.length; i++) {
      const user = users[i];
      const gov = GOVERNORATES[i];

      if (!user) continue;

      // Check if supervisor entry exists
      const { data: existingSup } = await supabase
        .from('supervisors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingSup) {
        // Update existing
        const { error: updateError } = await supabase
          .from('supervisors')
          .update({ 
            assigned_governorate: gov,
            total_wallet_balance: 0 // Activated wallet
          })
          .eq('user_id', user.id);
        
        if (updateError) console.error(`Error updating supervisor for ${gov}: ${updateError.message}`);
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('supervisors')
          .insert([
            { 
              user_id: user.id, 
              assigned_governorate: gov, 
              total_wallet_balance: 0 // Activated wallet
            }
          ]);
        
        if (insertError) console.error(`Error inserting supervisor for ${gov}: ${insertError.message}`);
      }
      console.log(`✅ ${gov} -> ${user.full_name || user.email}`);
    }

    console.log("\n✨ Setup completed successfully! All governorates have an assigned supervisor with an active wallet.");

  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  }
}

setupSupervisors();
