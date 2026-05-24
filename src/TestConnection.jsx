import { useEffect } from 'react';
import { supabase } from './supabaseClient'; // استدعاء ملف الاتصال اللي عملناه

function TestConnection() {
  useEffect(() => {
    async function checkSupabase() {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      
      if (error) {
        console.error("❌ فيه مشكلة في الاتصال:", error.message);
      } else {
        console.log("✅ الاتصال شغال تمام! البيانات اللي رجعت:", data);
      }
    }
    checkSupabase();
  }, []);

  return <h1>بنجرب الاتصال.. افتح الـ Console في المتصفح وشوف النتيجة!</h1>;
}

export default TestConnection;
    
