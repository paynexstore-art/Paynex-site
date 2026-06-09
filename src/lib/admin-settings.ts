import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AdminSettings {
  id: string;
  fees: {
    transaction_fee: number;
    platform_fee: number;
    refund_fee: number;
  };
  ads: {
    google_ad_client: string;
    enable_ads: boolean;
    ad_slots: Record<string, string>;
  };
  seo: {
    enable_analytics: boolean;
    google_analytics_id: string;
  };
  updated_at: string;
}

// Get admin settings with proper error handling
export async function getAdminSettings(): Promise<AdminSettings | null> {
  try {
    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated');
      return null;
    }

    // Fetch admin settings
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    return data as AdminSettings;
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}

// Save fees with admin authentication
export async function saveFeeSettings(fees: AdminSettings['fees']): Promise<boolean> {
  try {
    // Verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error('خطأ: لم يتم تسجيل الدخول بشكل صحيح');
      return false;
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      toast.error('خطأ: ليس لديك صلاحيات كافية');
      return false;
    }

    // Update fees
    const { error } = await supabase
      .from('admin_settings')
      .update({
        fees,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'admin-config');

    if (error) {
      toast.error(`خطأ في الحفظ: ${error.message}`);
      return false;
    }

    toast.success('تم حفظ الرسوم بنجاح ✓');
    return true;
  } catch (err) {
    console.error('Error saving fees:', err);
    toast.error('خطأ غير متوقع');
    return false;
  }
}

// Save Google Ads settings
export async function saveAdSettings(ads: AdminSettings['ads']): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error('خطأ: لم يتم تسجيل الدخول');
      return false;
    }

    const { error } = await supabase
      .from('admin_settings')
      .update({
        ads,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'admin-config');

    if (error) {
      toast.error(`خطأ: ${error.message}`);
      return false;
    }

    toast.success('تم حفظ إعدادات الإعلانات بنجاح ✓');
    return true;
  } catch (err) {
    console.error('Error saving ad settings:', err);
    toast.error('خطأ غير متوقع');
    return false;
  }
}

// Save SEO settings
export async function saveSEOSettings(seo: AdminSettings['seo']): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error('خطأ: لم يتم تسجيل الدخول');
      return false;
    }

    const { error } = await supabase
      .from('admin_settings')
      .update({
        seo,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'admin-config');

    if (error) {
      toast.error(`خطأ: ${error.message}`);
      return false;
    }

    toast.success('تم حفظ إعدادات SEO بنجاح ✓');
    return true;
  } catch (err) {
    console.error('Error saving SEO settings:', err);
    toast.error('خطأ غير متوقع');
    return false;
  }
}
