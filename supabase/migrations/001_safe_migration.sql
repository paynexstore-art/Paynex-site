-- 001_safe_migration.sql
-- Paynix Safe Migration

-- 2.1 | تفعيل الإضافات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2.2 | جدول المستخدمين users
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  phone             VARCHAR(20) UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  full_name         VARCHAR(255) NOT NULL,
  role              VARCHAR(20) NOT NULL
                    CHECK (role IN ('super_admin','supervisor','customer')),
  avatar_url        TEXT,
  national_id       TEXT,
  governorate       VARCHAR(100),
  address           TEXT,
  job_title         VARCHAR(100),
  is_active         BOOLEAN DEFAULT true,
  is_locked         BOOLEAN DEFAULT false,
  lock_reason       TEXT,
  google_id         VARCHAR(255),
  last_login        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS governorate VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2.3 | جدول المشرفين supervisors
CREATE TABLE IF NOT EXISTS supervisors (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_governorate      VARCHAR(100) NOT NULL,
  governorate_coordinates   JSONB,
  base_salary               DECIMAL(10,2) DEFAULT 0,
  current_month_bonus       DECIMAL(10,2) DEFAULT 0,
  current_month_penalties   DECIMAL(10,2) DEFAULT 0,
  current_month_orders      INTEGER DEFAULT 0,
  total_wallet_balance      DECIMAL(10,2) DEFAULT 0,
  total_debt                DECIMAL(10,2) DEFAULT 0,
  opening_balance           DECIMAL(10,2) DEFAULT 0,
  work_start_time           TIME DEFAULT '09:00:00',
  work_end_time             TIME DEFAULT '17:00:00',
  work_days                 JSONB DEFAULT '["sat","sun","mon","tue","wed"]',
  target_orders_monthly     INTEGER DEFAULT 1500,
  target_bonus              DECIMAL(10,2) DEFAULT 3000,
  is_checked_in             BOOLEAN DEFAULT false,
  last_checkin_at           TIMESTAMPTZ,
  last_checkout_at          TIMESTAMPTZ,
  last_checkin_location     JSONB,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS governorate_coordinates JSONB;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 0;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS current_month_bonus DECIMAL(10,2) DEFAULT 0;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS current_month_penalties DECIMAL(10,2) DEFAULT 0;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS current_month_orders INTEGER DEFAULT 0;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS total_wallet_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS total_debt DECIMAL(10,2) DEFAULT 0;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00:00';
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00:00';
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS work_days JSONB DEFAULT '["sat","sun","mon","tue","wed"]';
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS target_orders_monthly INTEGER DEFAULT 1500;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS target_bonus DECIMAL(10,2) DEFAULT 3000;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS is_checked_in BOOLEAN DEFAULT false;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS last_checkin_at TIMESTAMPTZ;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS last_checkout_at TIMESTAMPTZ;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS last_checkin_location JSONB;

-- 2.4 | جدول المنتجات products
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar         VARCHAR(500) NOT NULL,
  name_en         VARCHAR(500),
  description_ar  TEXT,
  description_en  TEXT,
  original_price  DECIMAL(10,2) NOT NULL,
  display_price   DECIMAL(10,2),
  category        VARCHAR(100),
  brand           VARCHAR(100),
  images          JSONB DEFAULT '[]',
  specs           JSONB DEFAULT '{}',
  stock_status    VARCHAR(20) DEFAULT 'available',
  is_active       BOOLEAN DEFAULT true,
  is_featured     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'available';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2.5 | جدول الإعدادات المالية financial_config
CREATE TABLE IF NOT EXISTS financial_config (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key    VARCHAR(100) UNIQUE NOT NULL,
  config_value  DECIMAL(10,4) NOT NULL,
  config_label  VARCHAR(200),
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO financial_config (config_key, config_value, config_label) VALUES ('interest_rate', 0.25, 'نسبة الفائدة') ON CONFLICT (config_key) DO NOTHING;
INSERT INTO financial_config (config_key, config_value, config_label) VALUES ('admin_fee', 150.00, 'الرسوم الإدارية') ON CONFLICT (config_key) DO NOTHING;
INSERT INTO financial_config (config_key, config_value, config_label) VALUES ('inquiry_fee', 100.00, 'رسوم الاستعلام') ON CONFLICT (config_key) DO NOTHING;
INSERT INTO financial_config (config_key, config_value, config_label) VALUES ('default_months', 12, 'مدة التقسيط الافتراضية') ON CONFLICT (config_key) DO NOTHING;
INSERT INTO financial_config (config_key, config_value, config_label) VALUES ('min_down_payment', 0.00, 'الحد الأدنى للمقدم') ON CONFLICT (config_key) DO NOTHING;
INSERT INTO financial_config (config_key, config_value, config_label) VALUES ('max_months', 36, 'الحد الأقصى للتقسيط') ON CONFLICT (config_key) DO NOTHING;
INSERT INTO financial_config (config_key, config_value, config_label) VALUES ('min_months', 3, 'الحد الأدنى للتقسيط') ON CONFLICT (config_key) DO NOTHING;

-- 2.6 | جدول الطلبات orders
CREATE TABLE IF NOT EXISTS orders (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number              VARCHAR(20) UNIQUE NOT NULL,
  customer_id               UUID REFERENCES users(id),
  product_id                UUID REFERENCES products(id),
  supervisor_id             UUID REFERENCES supervisors(id),
  customer_name             VARCHAR(255),
  customer_phone            VARCHAR(20),
  customer_national_id      TEXT,
  customer_governorate      VARCHAR(100),
  customer_address          TEXT,
  customer_job              VARCHAR(100),
  customer_location         JSONB,
  status                    VARCHAR(30) DEFAULT 'pending'
                            CHECK (status IN (
                              'pending',
                              'inquiry_fee_pending',
                              'under_inquiry',
                              'admin_review',
                              'approved',
                              'delivered',
                              'rejected',
                              'cancelled'
                            )),
  rejection_cooldown_until  TIMESTAMPTZ,
  product_price             DECIMAL(10,2),
  down_payment              DECIMAL(10,2) DEFAULT 0,
  months                    INTEGER DEFAULT 12,
  interest_rate             DECIMAL(5,4),
  admin_fee                 DECIMAL(10,2),
  inquiry_fee               DECIMAL(10,2),
  monthly_installment       DECIMAL(10,2),
  total_amount              DECIMAL(10,2),
  credit_score              INTEGER,
  inquiry_fee_paid          BOOLEAN DEFAULT false,
  inquiry_fee_paid_at       TIMESTAMPTZ,
  inquiry_fee_confirmed_by  UUID REFERENCES users(id),
  contract_pdf_url          TEXT,
  e_signature_url           TEXT,
  signed_at                 TIMESTAMPTZ,
  admin_override_notes      TEXT,
  final_decision_by         UUID REFERENCES users(id),
  submitted_at              TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at               TIMESTAMPTZ,
  approved_at               TIMESTAMPTZ,
  delivered_at              TIMESTAMPTZ,
  rejected_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES supervisors(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_location JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_cooldown_until TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_score INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inquiry_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inquiry_fee_paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inquiry_fee_confirmed_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_pdf_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS e_signature_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_override_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_decision_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2.7 | جدول المستندات documents
CREATE TABLE IF NOT EXISTS documents (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID REFERENCES orders(id) ON DELETE CASCADE,
  uploaded_by           UUID REFERENCES users(id),
  document_type         VARCHAR(50)
                        CHECK (document_type IN (
                          'national_id_front',
                          'national_id_back',
                          'utility_bill',
                          'salary_slip',
                          'medical_card',
                          'house_photo',
                          'other'
                        )),
  original_url          TEXT NOT NULL,
  processed_url         TEXT,
  file_size             INTEGER,
  gps_location          JSONB,
  gps_timestamp         TIMESTAMPTZ,
  is_location_verified  BOOLEAN DEFAULT false,
  distance_from_customer INTEGER,
  watermark_applied     BOOLEAN DEFAULT false,
  is_mock_location      BOOLEAN DEFAULT false,
  upload_device_info    JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 | جدول محفظة المشرف supervisor_wallet
CREATE TABLE IF NOT EXISTS supervisor_wallet (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id     UUID REFERENCES supervisors(id),
  transaction_type  VARCHAR(30)
                    CHECK (transaction_type IN (
                      'inquiry_fee_collected',
                      'down_payment_collected',
                      'installment_collected',
                      'debt_cleared_full',
                      'debt_cleared_partial',
                      'salary_paid',
                      'bonus_added',
                      'penalty_deducted',
                      'debt_carried_forward'
                    )),
  amount            DECIMAL(10,2) NOT NULL,
  balance_after     DECIMAL(10,2),
  order_id          UUID REFERENCES orders(id),
  description       TEXT,
  performed_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 | جدول تسجيل الحضور attendance
CREATE TABLE IF NOT EXISTS attendance (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id         UUID REFERENCES supervisors(id),
  date                  DATE NOT NULL,
  check_in_time         TIMESTAMPTZ,
  check_out_time        TIMESTAMPTZ,
  check_in_location     JSONB,
  check_out_location    JSONB,
  check_in_photo_url    TEXT,
  face_verified         BOOLEAN DEFAULT false,
  is_within_governorate BOOLEAN DEFAULT false,
  working_hours         DECIMAL(4,2),
  status                VARCHAR(20) DEFAULT 'present'
                        CHECK (status IN (
                          'present','absent','late','early_leave'
                        )),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 | جدول سجل النشاطات audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  user_role   VARCHAR(20),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 | جدول الإشعارات notifications
CREATE TABLE IF NOT EXISTS notifications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id     UUID REFERENCES users(id),
  type             VARCHAR(50),
  title            VARCHAR(255),
  body             TEXT,
  is_read          BOOLEAN DEFAULT false,
  related_order_id UUID REFERENCES orders(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 | جدول إعدادات الموقع site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key   VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type  VARCHAR(20),
  label         VARCHAR(200),
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('primary_color','#0A1628','color','اللون الرئيسي') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('secondary_color','#C9A84C','color','اللون الثانوي') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('hero_title_ar','التقسيط الذكي للجيل القادم','text','عنوان الهيرو') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('hero_subtitle_ar','اشترِ الآن وادفع بالطريقة التي تناسبك','text','وصف الهيرو') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('contact_whatsapp','','text','رقم واتساب') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('contact_facebook','','text','رابط فيسبوك') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('contact_instagram','','text','رابط انستجرام') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('total_customers_display','1000000','text','عدد العملاء للعرض') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('total_products_display','1000','text','عدد المنتجات للعرض') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('meta_title','Paynix - التقسيط الذكي','text','عنوان الميتا') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('meta_description','Paynix منصة التقسيط الذكي في مصر','text','وصف الميتا') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('header_scripts','','html','أكواد الهيدر') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('footer_scripts','','html','أكواد الفوتر') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('adsense_client_id','','text','معرف AdSense') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, setting_value, setting_type, label) VALUES ('moneytag_id','','text','معرف MoneyTag') ON CONFLICT (setting_key) DO NOTHING;

-- 2.13 | جدول الرواتب الشهرية monthly_payroll
CREATE TABLE IF NOT EXISTS monthly_payroll (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id   UUID REFERENCES supervisors(id),
  month           INTEGER NOT NULL,
  year            INTEGER NOT NULL,
  base_salary     DECIMAL(10,2),
  bonus           DECIMAL(10,2) DEFAULT 0,
  target_bonus    DECIMAL(10,2) DEFAULT 0,
  penalties       DECIMAL(10,2) DEFAULT 0,
  opening_debt    DECIMAL(10,2) DEFAULT 0,
  total_collected DECIMAL(10,2) DEFAULT 0,
  net_salary      DECIMAL(10,2),
  remaining_debt  DECIMAL(10,2) DEFAULT 0,
  is_approved     BOOLEAN DEFAULT false,
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  archived_data   JSONB,
  UNIQUE(supervisor_id, month, year)
);

-- 2.14 | جدول المكافآت والتارجت rewards
CREATE TABLE IF NOT EXISTS rewards (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id    UUID REFERENCES supervisors(id),
  month            INTEGER,
  year             INTEGER,
  orders_achieved  INTEGER DEFAULT 0,
  target_orders    INTEGER DEFAULT 1500,
  bonus_amount     DECIMAL(10,2) DEFAULT 3000,
  is_achieved      BOOLEAN DEFAULT false,
  awarded_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2.15 | جدول آراء العملاء testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255),
  content       TEXT NOT NULL,
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('أحمد محمد', 'خدمة ممتازة وتقسيط مريح جداً', 5, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('فاطمة علي', 'أفضل موقع تقسيط في مصر بدون مبالغة', 5, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('محمود حسن', 'سهل وسريع ومحترم في التعامل', 5, true, 3) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('نور الهدى', 'استلمت منتجي في أسرع وقت', 5, true, 4) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('كريم سامي', 'الأقساط مناسبة جداً لإمكانياتي', 5, true, 5) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('ريهام خالد', 'تجربة رائعة من البداية للنهاية', 5, true, 6) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('عمر إبراهيم', 'فريق المشرفين محترف جداً', 5, true, 7) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('سارة أحمد', 'أنصح الجميع بالتعامل مع Paynix', 5, true, 8) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('يوسف عادل', 'تقسيط بدون تعقيدات ومتابعة ممتازة', 5, true, 9) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('منى حمدي', 'خدمة العملاء متجاوبة في أي وقت', 5, true, 10) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('طارق سعيد', 'اشتريت لابتوب بقسط مناسب جداً', 5, true, 11) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('دينا وليد', 'سرعة التنفيذ مذهلة', 5, true, 12) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('بسام فاروق', 'ثقة تامة في التعامل', 5, true, 13) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('هالة رضا', 'أفضل قرار اتخذته هو التعامل مع Paynix', 5, true, 14) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('إسلام عاطف', 'تجربة شراء سلسة بدون أي ضغط', 5, true, 15) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('نادية فتحي', 'المشرف كان محترماً ودقيقاً', 5, true, 16) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('وائل جمال', 'أنصح كل محتاج تقسيط بـ Paynix', 5, true, 17) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('شيماء لطفي', 'الموقع سهل الاستخدام والتقسيط مريح', 5, true, 18) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('حسام الدين', 'خدمة تستحق التقييم الكامل', 5, true, 19) ON CONFLICT DO NOTHING;
INSERT INTO testimonials (customer_name, content, rating, is_active, sort_order) VALUES ('ياسمين رامي', 'شركة أمينة ومحترمة في كل شيء', 5, true, 20) ON CONFLICT DO NOTHING;

-- 2.16 | جدول الشركاء والبراندات brands
CREATE TABLE IF NOT EXISTS brands (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255),
  logo_url    TEXT,
  website_url TEXT,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO brands (name, is_active, sort_order) VALUES ('Samsung', true, 1), ('Apple', true, 2), ('Huawei', true, 3), ('Xiaomi', true, 4), ('LG', true, 5), ('Sony', true, 6), ('Dell', true, 7), ('HP', true, 8), ('Lenovo', true, 9), ('Asus', true, 10), ('Toshiba', true, 11), ('Hisense', true, 12), ('TCL', true, 13), ('Oppo', true, 14), ('Realme', true, 15), ('OnePlus', true, 16), ('Nokia', true, 17), ('Philips', true, 18), ('Sharp', true, 19), ('Panasonic', true, 20) ON CONFLICT DO NOTHING;

-- 2.17 | Row Level Security RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_users" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');
CREATE POLICY "customer_own_data" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "supervisor_own_orders" ON orders FOR SELECT USING (supervisor_id IN (SELECT id FROM supervisors WHERE user_id = auth.uid()));
CREATE POLICY "admin_audit_logs_only" ON audit_logs FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin');
