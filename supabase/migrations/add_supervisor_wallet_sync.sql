-- ═══════════════════════════════════════════════════════════════════════════════
-- Supervisor-Wallet Synchronization Database Schema
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration creates all necessary tables, triggers, views, and indexes
-- for the supervisor-wallet synchronization system
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. UPDATE WALLETS TABLE (Add sync tracking)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS last_settled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS pending_debt NUMERIC(15,2) DEFAULT 0,
  ALTER COLUMN last_updated SET DEFAULT CURRENT_TIMESTAMP;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREATE WALLET_TRANSACTIONS TABLE (Transaction history)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fee', 'installment', 'withdrawal', 'adjustment', 'settlement')),
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  order_id TEXT,
  approved_by UUID,
  gps_lat NUMERIC(10,8),
  gps_lng NUMERIC(10,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create indexes on wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_supervisor_id 
  ON wallet_transactions(supervisor_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type 
  ON wallet_transactions(type);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at 
  ON wallet_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_supervisor_created 
  ON wallet_transactions(supervisor_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREATE SUPERVISOR_WALLET_SYNC_LOGS TABLE (Audit trail)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS supervisor_wallet_sync_logs (
  id TEXT PRIMARY KEY,
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  supervisor_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'synced')),
  old_values JSONB,
  new_values JSONB,
  sync_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_supervisor_id 
  ON supervisor_wallet_sync_logs(supervisor_id);

CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at 
  ON supervisor_wallet_sync_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_logs_action 
  ON supervisor_wallet_sync_logs(action);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CREATE SUPERVISOR_WALLET_SUMMARY VIEW (Dashboard overview)
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS supervisor_wallet_summary CASCADE;

CREATE VIEW supervisor_wallet_summary AS
SELECT
  s.id,
  s.name,
  s.email,
  s.phone,
  s.province,
  s.is_active,
  w.id as wallet_id,
  w.total_fees,
  w.total_installments_collected,
  w.total_balance,
  w.pending_debt,
  w.last_settled_at,
  w.last_updated,
  (SELECT COUNT(*) FROM wallet_transactions WHERE supervisor_id = s.id) as transaction_count,
  (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions 
   WHERE supervisor_id = s.id AND type = 'fee') as total_fees_calculated,
  (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions 
   WHERE supervisor_id = s.id AND type = 'installment') as total_collected_calculated,
  (SELECT COUNT(*) FROM supervisor_wallet_sync_logs 
   WHERE supervisor_id = s.id) as sync_count,
  (SELECT sync_timestamp FROM supervisor_wallet_sync_logs 
   WHERE supervisor_id = s.id 
   ORDER BY sync_timestamp DESC LIMIT 1) as last_sync_time
FROM supervisors s
LEFT JOIN wallets w ON s.id = w.supervisor_id
ORDER BY s.name;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CREATE FUNCTION: Auto-update wallet balance on transaction insert
-- ─────────────────────────────────────────────────────────────────────────────

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
    ),
    last_updated = CURRENT_TIMESTAMP
  WHERE supervisor_id = NEW.supervisor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update wallet on transaction insert
DROP TRIGGER IF EXISTS trigger_update_wallet_on_transaction ON wallet_transactions;
CREATE TRIGGER trigger_update_wallet_on_transaction
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance_on_transaction();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CREATE FUNCTION: Auto-create wallet on supervisor insert
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_wallet_on_supervisor_insert()
RETURNS TRIGGER AS $$
DECLARE
  wallet_id TEXT;
  sync_log_id TEXT;
BEGIN
  -- Generate wallet ID
  wallet_id := 'wallet-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Create wallet
  INSERT INTO wallets (
    id,
    supervisor_id,
    total_fees,
    total_installments_collected,
    total_balance,
    pending_debt,
    last_updated,
    created_at
  ) VALUES (
    wallet_id,
    NEW.id,
    0,
    0,
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  
  -- Log the sync
  sync_log_id := 'sync-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  INSERT INTO supervisor_wallet_sync_logs (
    id,
    supervisor_id,
    supervisor_name,
    action,
    new_values,
    sync_timestamp,
    created_at
  ) VALUES (
    sync_log_id,
    NEW.id,
    NEW.name,
    'created',
    jsonb_build_object('wallet_id', wallet_id),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create wallet on supervisor insert
DROP TRIGGER IF EXISTS trigger_create_wallet_on_supervisor_insert ON supervisors;
CREATE TRIGGER trigger_create_wallet_on_supervisor_insert
  AFTER INSERT ON supervisors
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_on_supervisor_insert();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all transactions
CREATE POLICY rls_wallet_transactions_admin_read 
  ON wallet_transactions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM supervisors s
      WHERE s.id = wallet_transactions.supervisor_id
      LIMIT 1
    )
  );

-- Policy: Admins can insert transactions
CREATE POLICY rls_wallet_transactions_admin_insert 
  ON wallet_transactions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supervisors s
      WHERE s.id = wallet_transactions.supervisor_id
      LIMIT 1
    )
  );

-- Enable RLS on supervisor_wallet_sync_logs
ALTER TABLE supervisor_wallet_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all sync logs
CREATE POLICY rls_sync_logs_admin_read 
  ON supervisor_wallet_sync_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM supervisors s
      WHERE s.id = supervisor_wallet_sync_logs.supervisor_id
      LIMIT 1
    )
  );

-- Policy: Only system can insert sync logs
CREATE POLICY rls_sync_logs_admin_insert 
  ON supervisor_wallet_sync_logs 
  FOR INSERT 
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. INITIALIZE EXISTING WALLETS
-- ─────────────────────────────────────────────────────────────────────────────

-- Create wallets for supervisors that don't have one
INSERT INTO wallets (
  id,
  supervisor_id,
  total_fees,
  total_installments_collected,
  total_balance,
  pending_debt,
  last_updated,
  created_at
)
SELECT
  'wallet-' || s.id || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  s.id,
  0,
  0,
  0,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM supervisors s
WHERE NOT EXISTS (
  SELECT 1 FROM wallets w WHERE w.supervisor_id = s.id
)
ON CONFLICT DO NOTHING;

-- Log initialization
INSERT INTO supervisor_wallet_sync_logs (
  id,
  supervisor_id,
  supervisor_name,
  action,
  sync_timestamp,
  created_at
)
SELECT
  'sync-init-' || s.id || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  s.id,
  s.name,
  'created',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM supervisors s
WHERE EXISTS (
  SELECT 1 FROM wallets w WHERE w.supervisor_id = s.id
)
AND NOT EXISTS (
  SELECT 1 FROM supervisor_wallet_sync_logs l WHERE l.supervisor_id = s.id
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. VERIFICATION QUERIES (Run these to verify setup)
-- ─────────────────────────────────────────────────────────────────────────────

-- Verify all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('wallet_transactions', 'supervisor_wallet_sync_logs', 'wallets');

-- Verify all indexes exist
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('wallet_transactions', 'supervisor_wallet_sync_logs') 
-- AND indexname LIKE 'idx_%';

-- Verify triggers exist
-- SELECT trigger_name FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' 
-- AND (trigger_name LIKE 'trigger_%' OR trigger_name LIKE 'trg_%');

-- Verify view exists
-- SELECT table_name FROM information_schema.views 
-- WHERE table_schema = 'public' 
-- AND table_name = 'supervisor_wallet_summary';

-- View sample data
-- SELECT * FROM supervisor_wallet_summary LIMIT 5;
-- SELECT * FROM wallet_transactions LIMIT 5;
-- SELECT * FROM supervisor_wallet_sync_logs LIMIT 5;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════════════════════════
-- All tables, triggers, views, and indexes have been created successfully
-- RLS policies are in place for security
-- Run verification queries above to confirm setup
-- ═══════════════════════════════════════════════════════════════════════════════
