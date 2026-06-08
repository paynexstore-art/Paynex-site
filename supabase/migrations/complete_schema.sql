-- ═══════════════════════════════════════════════════════════════════════════════
-- Qastly (قسطلي) Complete Database Schema
-- Tables: users, products, orders, supervisors, wallets, wallet_transactions,
--         audit_logs, whatsapp_logs, e_signatures, mock_location_checks,
--         field_activities, site_settings, testimonials
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS (profiles)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  national_id TEXT,
  province TEXT,
  address TEXT,
  job TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'supervisor', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SUPERVISORS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  province TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '000000',
  work_hours_start TEXT DEFAULT '09:00',
  work_hours_end TEXT DEFAULT '17:00',
  work_days TEXT[] DEFAULT ARRAY['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء'],
  target INTEGER DEFAULT 50,
  base_salary NUMERIC(12,2) DEFAULT 3000,
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  last_check_out_at TIMESTAMP,
  pending_debt NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name_en TEXT,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price > 0),
  original_price NUMERIC(12,2),
  image_url TEXT,
  images TEXT[],
  category TEXT NOT NULL,
  category_ar TEXT,
  brand TEXT,
  source TEXT NOT NULL CHECK (source IN ('aman', 'btech', 'manual')),
  source_id TEXT,
  source_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 0,
  specs JSONB,
  admin_price_override NUMERIC(12,2),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price protection: prevent zero/null price updates via trigger
CREATE OR REPLACE FUNCTION check_price_protection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS NULL OR NEW.price <= 0 THEN
    RAISE EXCEPTION 'Price cannot be zero or null';
  END IF;
  IF NEW.original_price IS NOT NULL AND NEW.original_price > 0 AND NEW.price > NEW.original_price * 3 THEN
    RAISE WARNING 'Price spike detected: % -> %', NEW.original_price, NEW.price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_price_protection ON products;
CREATE TRIGGER trg_price_protection
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_price_protection();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_national_id TEXT NOT NULL,
  customer_email TEXT,
  customer_province TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_job TEXT,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  installment_months INTEGER DEFAULT 12,
  down_payment NUMERIC(12,2) DEFAULT 0,
  interest_rate NUMERIC(5,4) DEFAULT 0,
  admin_fee NUMERIC(12,2) DEFAULT 2,
  inquiry_fee NUMERIC(12,2) DEFAULT 150,
  monthly_payment NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'under-review', 'approved', 'rejected', 'delivered', 'admin-review'
  )),
  supervisor_id UUID REFERENCES supervisors(id) ON DELETE SET NULL,
  documents JSONB DEFAULT '{}',
  field_visit_gps JSONB,
  e_signature JSONB,
  credit_score JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rejected_at TIMESTAMP,
  approved_at TIMESTAMP,
  delivered_at TIMESTAMP,
  can_reapply_at TIMESTAMP
);

-- Order status workflow trigger: enforce admin-only approval
CREATE OR REPLACE FUNCTION check_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow status changes to 'approved' or 'rejected' by admin role
  IF (NEW.status = 'approved' OR NEW.status = 'rejected') AND OLD.status != NEW.status THEN
    -- In a real RLS + app context, this is enforced by application logic / RLS policies
    -- Here we log the change for audit
    INSERT INTO audit_logs (action, entity_type, entity_id, old_values, new_values, created_at)
    VALUES (
      'ORDER_STATUS_CHANGE',
      'order',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      CURRENT_TIMESTAMP
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_audit ON orders;
CREATE TRIGGER trg_order_status_audit
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_order_status_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. WALLETS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  total_fees NUMERIC(15,2) DEFAULT 0,
  total_installments_collected NUMERIC(15,2) DEFAULT 0,
  total_balance NUMERIC(15,2) DEFAULT 0,
  pending_debt NUMERIC(15,2) DEFAULT 0,
  last_settled_at TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. WALLET_TRANSACTIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fee', 'installment', 'withdrawal', 'adjustment', 'settlement')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  approved_by UUID,
  gps_lat NUMERIC(10,8),
  gps_lng NUMERIC(10,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_supervisor_id ON wallet_transactions(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Auto-update wallet balance on transaction insert
CREATE OR REPLACE FUNCTION update_wallet_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wallets
  SET
    total_fees = (
      SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions
      WHERE supervisor_id = NEW.supervisor_id AND type = 'fee'
    ),
    total_installments_collected = (
      SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions
      WHERE supervisor_id = NEW.supervisor_id AND type = 'installment'
    ),
    total_balance = (
      SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions
      WHERE supervisor_id = NEW.supervisor_id AND type IN ('fee', 'installment')
    ),
    pending_debt = (
      SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions
      WHERE supervisor_id = NEW.supervisor_id AND type IN ('fee', 'installment')
      AND created_at > COALESCE((SELECT last_settled_at FROM wallets WHERE supervisor_id = NEW.supervisor_id), '1970-01-01')
    ),
    last_updated = CURRENT_TIMESTAMP
  WHERE supervisor_id = NEW.supervisor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_on_transaction ON wallet_transactions;
CREATE TRIGGER trigger_update_wallet_on_transaction
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance_on_transaction();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. AUDIT_LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. WHATSAPP_LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  template TEXT NOT NULL CHECK (template IN (
    'installment_reminder', 'late_alert', 'thank_you', 'admin_approval', 'doc_request'
  )),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_order_id ON whatsapp_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. E_SIGNATURES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS e_signatures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signed_by TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_e_signatures_order_id ON e_signatures(order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. MOCK_LOCATION_CHECKS (Server-side verification)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_location_checks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  supervisor_id UUID REFERENCES supervisors(id) ON DELETE SET NULL,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  lat NUMERIC(10,8) NOT NULL,
  lng NUMERIC(10,8) NOT NULL,
  accuracy NUMERIC(10,2),
  is_mock BOOLEAN DEFAULT false,
  detection_reason TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mock_location_supervisor ON mock_location_checks(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_mock_location_order ON mock_location_checks(order_id);

-- Haversine distance function (server-side)
CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 NUMERIC, lng1 NUMERIC,
  lat2 NUMERIC, lng2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  dlat NUMERIC;
  dlng NUMERIC;
  a NUMERIC;
  c NUMERIC;
  r NUMERIC := 6371000; -- Earth radius in meters
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)^2;
  c := 2 * asin(sqrt(a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. FIELD_ACTIVITIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS field_activities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('check_in', 'check_out', 'doc_upload', 'delivery', 'visit')),
  lat NUMERIC(10,8),
  lng NUMERIC(10,8),
  accuracy NUMERIC(10,2),
  distance_meters NUMERIC(10,2),
  within_radius BOOLEAN,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_field_activities_supervisor ON field_activities(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_field_activities_order ON field_activities(order_id);
CREATE INDEX IF NOT EXISTS idx_field_activities_created_at ON field_activities(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. SITE_SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. TESTIMONIALS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  province TEXT,
  text TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. SUPERVISOR_LOCK LOGIC (function + trigger)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_supervisor_lock()
RETURNS TRIGGER AS $$
DECLARE
  last_settled TIMESTAMP;
  hours_since NUMERIC;
BEGIN
  SELECT last_settled_at INTO last_settled FROM wallets WHERE supervisor_id = NEW.supervisor_id;
  hours_since := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(last_settled, '1970-01-01'))) / 3600;

  -- If pending debt > 0 and not settled in 24h, lock supervisor
  IF NEW.pending_debt > 0 AND hours_since > 24 THEN
    UPDATE supervisors SET is_locked = true WHERE id = NEW.supervisor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_supervisor_lock_check ON wallets;
CREATE TRIGGER trg_supervisor_lock_check
  AFTER UPDATE ON wallets
  FOR EACH ROW
  WHEN (OLD.pending_debt IS DISTINCT FROM NEW.pending_debt)
  EXECUTE FUNCTION check_supervisor_lock();

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. AUTO-CREATE WALLET ON SUPERVISOR INSERT
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_wallet_on_supervisor_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (id, supervisor_id, total_fees, total_installments_collected, total_balance, pending_debt, last_updated, created_at)
  VALUES (
    'wallet-' || NEW.id::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    NEW.id,
    0, 0, 0, 0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_wallet_on_supervisor_insert ON supervisors;
CREATE TRIGGER trigger_create_wallet_on_supervisor_insert
  AFTER INSERT ON supervisors
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_on_supervisor_insert();

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES (Enable on tables where applicable)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_location_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_activities ENABLE ROW LEVEL SECURITY;

-- Example: allow all for authenticated users (fine-tune in production via app roles)
CREATE POLICY IF NOT EXISTS "Allow all" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON wallet_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON whatsapp_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON e_signatures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON mock_location_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON field_activities FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INSERT DEFAULT TESTIMONIALS (20 entries)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO testimonials (name, province, text, rating) VALUES
('أحمد محمد', 'القاهرة', 'خدمة رائعة! حصلت على موبايلي بقسط شهري بسيط وبدون أي مشاكل.', 5),
('سارة علي', 'الجيزة', 'المشرف كان محترماً جداً وإجراءات سريعة. قسطلي غيرت فكرتي عن التقسيط.', 5),
('محمود حسن', 'الإسكندرية', 'أفضل خدمة تقسيط في مصر. أسعار مناسبة وخدمة عملاء استثنائية.', 5),
('فاطمة إبراهيم', 'الشرقية', 'كنت محتاجة لابتوب للشغل وقسطلي حلت مشكلتي في أسرع وقت.', 5),
('عمر خالد', 'الإسماعيلية', 'اشتريت تليفزيون كبير وقسطته على 24 شهر، الدفعة الشهرية خفيفة.', 5),
('منى سعيد', 'المنيا', 'تعامل راقي من المشرف وسرعة في إتمام الطلب. نصحت كل أصحابي بقسطلي.', 5),
('كريم رمضان', 'أسيوط', 'بدون فوائد حقيقي! حصلت على PS5 بسهولة تامة. الكلام ده صحيح فعلاً.', 5),
('هدى عبد الله', 'قنا', 'خدمة عملاء ممتازة والمشرف رد في أقل من ساعة على جميع استفساراتي.', 5),
('أيمن طه', 'سوهاج', 'الموقع سهل جداً وواضح. قدمت الطلب واتقبل في نفس اليوم تقريباً.', 5),
('نهاد مصطفى', 'بني سويف', 'اشتريت غسالة جديدة لبيتي بدون أي ضغط مالي. شكراً قسطلي.', 5),
('محمد عبدالعزيز', 'القاهرة', 'تجربة ممتازة وموثوقة. قسطلي فعلاً حلت لي مشكلة التقسيط البنكي.', 5),
('ليلى سامي', 'الجيزة', 'الموافقة سريعة والمشرف محترم. أنصح أي حد يفكر يقسط من قسطلي.', 5),
('خالد محمود', 'الإسكندرية', 'سعر المنتج نفس السوق والقسط مناسب. ما فيش زيادة خفية.', 5),
('نورهان أحمد', 'الدقهلية', 'أول مرة أقسط online وكانت تجربة رائعة. شكراً لفريق قسطلي.', 5),
('عبدالرحمن علي', 'القليوبية', 'التوصيل سريع والمشرف جاب كل المستندات المطلوبة. 10/10.', 5),
('سامية فؤاد', 'الفيوم', 'قسطت تليفزيون لمطبخي. القسط الشهري أقل من فاتورة النت! شكراً.', 5),
('مصطفى إبراهيم', 'كفر الشيخ', 'التعامل شفاف والمشرف واضح في كل خطوة. قسطلي اسمها على مسمى.', 5),
('ريم حسام', 'دمياط', 'المنتج وصلني سليم ومغلف بعناية. تجربة تقسيط ناجحة بكل المقاييس.', 5),
('ياسر محسن', 'بور سعيد', 'الحاسبة التفاعلية ساعدتني أختار أفضل خطة. قسطلي فعلاً ذكية.', 5),
('هاجر سيد', 'السويس', 'خدمة ما بعد البيع ممتازة. لما واجهت مشكلة في الجهاز، ردوا عليّ فوراً.', 5)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INSERT DEFAULT ADMIN (if not exists)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO users (email, full_name, role, is_active)
VALUES ('adminqastly@gmail.com', 'المدير العام', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INSERT DEFAULT SUPERVISOR (if not exists)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO supervisors (name, email, phone, province, password, is_active)
VALUES ('محمد حسن', 'supervisor.cairo@qastly.com', '01098765432', 'cairo', '000000', true)
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════════════════════════
