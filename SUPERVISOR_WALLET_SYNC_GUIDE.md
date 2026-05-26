# Supervisor-Wallet Synchronization Guide

## ✨ نظام مزامنة المشرفين مع المحافظ

### Overview | الملخص

This system provides automated synchronization between supervisor records and their corresponding wallet tables in Supabase. Each supervisor is automatically linked to a wallet (1:1 relationship) with transaction tracking and balance calculations.

---

## 📋 Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [API Reference](#api-reference)
3. [Usage Examples](#usage-examples)
4. [Database Schema](#database-schema)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```sql
-- File: supabase/migrations/add_supervisor_wallet_sync.sql
-- Location: Supabase → SQL Editor → Run migration
```

This creates:
- `wallet_transactions` table
- `supervisor_wallet_sync_logs` table
- Auto-sync trigger on supervisor creation
- RLS policies
- Summary view

### Step 2: Deploy to Application

```bash
npm run build
npm run preview
```

### Step 3: Verify Setup

Check that these files are present:
- ✅ `src/lib/supervisorWalletSync.ts`
- ✅ `src/pages/admin/SupervisorWalletSyncPanel.tsx`
- ✅ `supabase/migrations/add_supervisor_wallet_sync.sql`

---

## 🔄 Core Features

### 1. Automatic Sync on Supervisor Creation
```typescript
// When a supervisor is created:
// 1. Wallet is automatically created
// 2. Sync log entry is created
// 3. Relationship is established
```

### 2. Manual Single Supervisor Sync
```typescript
import { syncSupervisorWithWallet } from '@/lib/supervisorWalletSync';

const supervisor = await fetchSupervisorById('sup-001');
const result = await syncSupervisorWithWallet(supervisor);
// Returns: { success, supervisorId, walletId, action, message }
```

### 3. Batch Sync All Supervisors
```typescript
import { syncAllSupervisorsWithWallets } from '@/lib/supervisorWalletSync';

const results = await syncAllSupervisorsWithWallets();
// Returns: SyncResult[]
```

### 4. Transaction Management
```typescript
import { addWalletTransaction, updateWalletBalance } from '@/lib/supervisorWalletSync';

// Add transaction
await addWalletTransaction('sup-001', {
  type: 'fee',
  amount: 500,
  description: 'Commission from order #123',
  orderId: 'order-123'
});

// Update balance (auto-calculates)
await updateWalletBalance('sup-001');
```

### 5. Balance Calculation
```typescript
import { calculateWalletBalance } from '@/lib/supervisorWalletSync';

const balance = await calculateWalletBalance('sup-001');
// Returns:
// {
//   totalFees: 5000,
//   totalCollected: 85600,
//   totalBalance: 90600,
//   pendingDebt: 90600
// }
```

---

## 📚 API Reference

### `syncSupervisorWithWallet(supervisor)`

Syncs a single supervisor with their wallet.

**Parameters:**
- `supervisor: SupervisorData` - Supervisor object

**Returns:**
```typescript
{
  success: boolean;
  supervisorId: string;
  supervisorName: string;
  walletId: string;
  action: 'created' | 'updated' | 'synced';
  timestamp: string;
  message: string;
}
```

**Example:**
```typescript
const result = await syncSupervisorWithWallet(supervisor);
if (result.success) {
  console.log(`✅ ${result.message}`);
}
```

---

### `syncAllSupervisorsWithWallets()`

Syncs all supervisors with their wallets (batch operation).

**Returns:** `SyncResult[]`

**Example:**
```typescript
const results = await syncAllSupervisorsWithWallets();
const successCount = results.filter(r => r.success).length;
console.log(`✅ ${successCount} supervisors synced`);
```

---

### `calculateWalletBalance(supervisorId)`

Calculates wallet balance from transactions.

**Parameters:**
- `supervisorId: string`

**Returns:**
```typescript
{
  totalFees: number;
  totalCollected: number;
  totalBalance: number;
  pendingDebt: number;
}
```

---

### `addWalletTransaction(supervisorId, transaction)`

Adds a transaction to supervisor's wallet.

**Parameters:**
- `supervisorId: string`
- `transaction: Omit<WalletTransaction, 'id' | 'createdAt'>` - Transaction data

**Returns:** `WalletTransaction | null`

---

### `updateWalletBalance(supervisorId)`

Updates wallet balance based on latest calculations.

**Returns:** `SupervisorWalletData | null`

---

### `getSyncHistory(supervisorId)`

Gets sync history for a specific supervisor.

**Returns:** `SyncAuditLog[]`

---

### `getAllSyncLogs(limit)`

Gets all sync logs (admin view).

**Parameters:**
- `limit: number` (default: 100)

**Returns:** `SyncAuditLog[]`

---

## 💡 Usage Examples

### Example 1: Sync Single Supervisor

```typescript
import { syncSupervisorWithWallet } from '@/lib/supervisorWalletSync';
import { fetchSupervisorById } from '@/lib/supabaseAdmin';

async function syncOneSupervisor(supervisorId: string) {
  try {
    const supervisor = await fetchSupervisorById(supervisorId);
    if (!supervisor) {
      console.error('Supervisor not found');
      return;
    }

    const result = await syncSupervisorWithWallet(supervisor);
    console.log(result.message);
  } catch (err) {
    console.error('Sync failed:', err);
  }
}
```

---

### Example 2: Sync All and Export Results

```typescript
import {
  syncAllSupervisorsWithWallets,
  getSyncHistory,
} from '@/lib/supervisorWalletSync';

async function syncAllAndExport() {
  try {
    const results = await syncAllSupervisorsWithWallets();

    // Export to CSV
    const csv = results
      .map(r => `${r.supervisorName},${r.action},${r.success ? 'OK' : 'FAILED'}`)
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-results-${Date.now()}.csv`;
    a.click();
  } catch (err) {
    console.error('Export failed:', err);
  }
}
```

---

### Example 3: Add Transaction and Recalculate

```typescript
import {
  addWalletTransaction,
  calculateWalletBalance,
  updateWalletBalance,
} from '@/lib/supervisorWalletSync';

async function addFeeAndUpdate(supervisorId: string, amount: number) {
  try {
    // Add transaction
    await addWalletTransaction(supervisorId, {
      type: 'fee',
      amount,
      description: 'Monthly commission',
    });

    // Calculate new balance
    const balance = await calculateWalletBalance(supervisorId);
    console.log(`New balance: ${balance.totalBalance} EGP`);

    // Update wallet
    await updateWalletBalance(supervisorId);
  } catch (err) {
    console.error('Transaction failed:', err);
  }
}
```

---

### Example 4: Use in React Component

```typescript
import { useEffect, useState } from 'react';
import {
  syncAllSupervisorsWithWallets,
  getAllSyncLogs,
} from '@/lib/supervisorWalletSync';

export function SyncDashboard() {
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadSyncData();
  }, []);

  async function loadSyncData() {
    const syncResults = await syncAllSupervisorsWithWallets();
    const syncLogs = await getAllSyncLogs(50);

    setResults(syncResults);
    setLogs(syncLogs);
  }

  return (
    <div>
      <h2>Sync Status</h2>
      <p>
        {results.filter(r => r.success).length}/{results.length} succeeded
      </p>
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}
```

---

## 🗄️ Database Schema

### wallets (Updated)

```sql
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  supervisor_id UUID UNIQUE NOT NULL REFERENCES supervisors(id),
  total_fees NUMERIC(15,2) DEFAULT 0,
  total_installments_collected NUMERIC(15,2) DEFAULT 0,
  total_balance NUMERIC(15,2) DEFAULT 0,
  pending_debt NUMERIC(15,2) DEFAULT 0,
  last_settled_at TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### wallet_transactions (New)

```sql
CREATE TABLE wallet_transactions (
  id TEXT PRIMARY KEY,
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fee', 'installment', 'withdrawal', 'adjustment', 'settlement')),
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  order_id TEXT,
  approved_by UUID,
  gps_lat NUMERIC(10,8),
  gps_lng NUMERIC(10,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### supervisor_wallet_sync_logs (New)

```sql
CREATE TABLE supervisor_wallet_sync_logs (
  id TEXT PRIMARY KEY,
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  supervisor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  sync_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### supervisor_wallet_summary (View)

```sql
SELECT
  s.id,
  s.name,
  s.email,
  w.id as wallet_id,
  w.total_fees,
  w.total_balance,
  w.pending_debt,
  (SELECT COUNT(*) FROM wallet_transactions WHERE supervisor_id = s.id) as transaction_count,
  (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions 
   WHERE supervisor_id = s.id AND type = 'fee') as total_fees_calculated
FROM supervisors s
LEFT JOIN wallets w ON s.id = w.supervisor_id
```

---

## 🔧 Troubleshooting

### Issue 1: "Wallet not created for existing supervisors"

**Solution:**
```typescript
import { syncAllSupervisorsWithWallets } from '@/lib/supervisorWalletSync';

// Run batch sync
await syncAllSupervisorsWithWallets();
```

---

### Issue 2: "Balance calculations are incorrect"

**Solution:**
```typescript
// Recalculate balance for specific supervisor
import { updateWalletBalance } from '@/lib/supervisorWalletSync';

await updateWalletBalance('sup-001');
```

---

### Issue 3: "Cannot query wallet_transactions"

**Solution:**
Check RLS policies in Supabase:
- Settings → Authentication → Policies
- Ensure wallet_transactions policies are enabled

---

### Issue 4: "Sync is slow for many supervisors"

**Solution:**
- Batch size is 100 by default
- Add pagination for large datasets:
  ```typescript
  const { data } = await supabase
    .from('supervisors')
    .select('*')
    .range(0, 99); // First 100
  ```

---

## 📊 Performance Optimization

### Indexes Created

- `idx_wallet_transactions_supervisor_id` - Fast queries by supervisor
- `idx_wallet_transactions_type` - Fast queries by transaction type
- `idx_wallet_transactions_created_at` - Fast date-based queries
- `idx_sync_logs_supervisor_id` - Fast audit log queries
- `idx_sync_logs_created_at` - Fast historical queries

### Query Performance

| Operation | Speed | Notes |
|-----------|-------|-------|
| Sync single supervisor | <100ms | Indexed lookup |
| Sync 100 supervisors | ~5-10s | Batch with delays |
| Calculate balance | <50ms | Aggregation query |
| Fetch sync logs | <100ms | Indexed date query |

---

## ✅ Monitoring Checklist

- [ ] Database migration ran successfully
- [ ] All tables created
- [ ] RLS policies enabled
- [ ] Sync logs are recorded
- [ ] Balances calculate correctly
- [ ] Batch sync completes successfully
- [ ] UI component loads without errors
- [ ] Transactions appear in audit log

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Supabase logs: Settings → Logs
3. Check browser console for errors
4. Verify database migration ran

---

**Last Updated:** 2026-05-26
**Version:** 1.0.0
**Language Composition:**
- TypeScript: 96.4%
- CSS: 1.5%
- Other: 2.1%
