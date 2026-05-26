-- ═══════════════════════════════════════════════════════════════
-- إنشاء جدول المشرفين والمديرين
-- ═══════════════════════════════════════════════════════════════

-- 1. إنشاء جدول admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager')),
  permissions JSONB DEFAULT '["view_dashboard", "view_orders", "view_supervisors"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  phone VARCHAR(20),
  province VARCHAR(100),
  work_hours_start TIME,
  work_hours_end TIME,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT admin_email_check CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- 2. إنشاء جدول audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  actor_id UUID,
  actor_email VARCHAR(255),
  actor_name VARCHAR(255),
  changes JSONB,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_actor_email (actor_email),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created_at (created_at)
);

-- 3. إنشاء جدول site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  data_type VARCHAR(50),
  description TEXT,
  last_updated_by UUID,
  last_updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. إدراج حساب المدير الرئيسي
INSERT INTO public.admin_users (
  email, 
  name, 
  role, 
  permissions, 
  is_active, 
  phone, 
  province
) VALUES (
  'adminqastly@gmail.com',
  'مدير النظام الرئيسي',
  'super_admin',
  '["*"]'::jsonb,
  true,
  '+20',
  'Cairo'
) ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  permissions = '["*"]'::jsonb,
  updated_at = NOW();

-- 5. إدراج الإعدادات الأساسية
INSERT INTO public.site_settings (setting_key, setting_value, data_type, description)
VALUES 
  ('inquiry_fee', '{"value": 200, "currency": "EGP"}'::jsonb, 'number', 'رسوم الاستعلام والآي سكور'),
  ('site_name', '{"ar": "PayNex", "en": "PayNex"}'::jsonb, 'string', 'اسم الموقع'),
  ('site_phone', '{"value": "+201000000000"}'::jsonb, 'string', 'رقم الموقع'),
  ('maintenance_mode', '{"enabled": false}'::jsonb, 'boolean', 'وضع الصيانة')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  last_updated_at = NOW();

-- 6. تفعيل Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 7. إنشاء سياسات الأمان للمشرفين
CREATE POLICY "admin_select_policy" ON public.admin_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin_update_policy" ON public.admin_users
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin_insert_policy" ON public.admin_users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_delete_policy" ON public.admin_users
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 8. سياسات سجل المراجعة
CREATE POLICY "audit_select_policy" ON public.audit_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "audit_insert_policy" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 9. سياسات الإعدادات
CREATE POLICY "settings_select_policy" ON public.site_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "settings_update_policy" ON public.site_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 10. إنشاء الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON public.audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(setting_key);

-- 11. إنشاء الدوال المساعدة
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. إنشاء المشاهد (Triggers)
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- ✅ تم إنشاء جميع الجداول والسياسات بنجاح!
-- ═══════════════════════════════════════════════════════════════
-- حساب المدير:
-- البريد: adminqastly@gmail.com
-- الدور: super_admin
-- الصلاحيات: جميع الأذونات
-- كلمة المرور السرية: Mm.273199
-- ═══════════════════════════════════════════════════════════════
