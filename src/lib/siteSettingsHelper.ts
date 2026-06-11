import { supabase } from "./supabase";
import { toast } from "sonner";

export async function getSiteSetting(key: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .single();

  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
  return data?.setting_value;
}

export async function setSiteSetting(key: string, value: string, userId?: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      setting_key: key,
      setting_value: value,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    toast.error(`Error saving setting ${key}: ${error.message}`);
    return false;
  }
  toast.success(`Setting ${key} updated successfully`);
  return true;
}

export async function getAllSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*');

  if (error) {
    console.error('Error fetching all site settings:', error);
    return [];
  }
  return data || [];
}
