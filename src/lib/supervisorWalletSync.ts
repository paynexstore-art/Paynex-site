/**
 * Supervisor-Wallet Synchronization Library
 * ═════════════════════════════════════════════════════
 * Handles automatic and manual sync between supervisors and their wallets
 * - Auto-sync on supervisor creation (1:1 relationship)
 * - Manual sync for single or batch operations
 * - Transaction tracking and balance calculations
 * - Complete audit logging for compliance
 */

import { createClient } from '@supabase/supabase-js';
import { SupervisorData } from '@/lib/supabaseAdmin';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  supervisor_id: string;
  type: 'fee' | 'installment' | 'withdrawal' | 'adjustment' | 'settlement';
  amount: number;
  description?: string;
  order_id?: string;
  approved_by?: string;
  gps_lat?: number;
  gps_lng?: number;
  created_at: string;
}

export interface SupervisorWalletData {
  id: string;
  supervisor_id: string;
  total_fees: number;
  total_installments_collected: number;
  total_balance: number;
  pending_debt: number;
  last_settled_at?: string;
  last_updated: string;
  created_at: string;
}

export interface SyncAuditLog {
  id: string;
  supervisor_id: string;
  supervisor_name: string;
  action: 'created' | 'updated' | 'synced';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  sync_timestamp: string;
  created_at: string;
}

export interface SyncResult {
  success: boolean;
  supervisorId: string;
  supervisorName: string;
  walletId?: string;
  action: 'created' | 'updated' | 'synced';
  timestamp: string;
  message: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────
// MAIN SYNC FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Sync a single supervisor with their wallet
 */
export async function syncSupervisorWithWallet(
  supervisor: SupervisorData
): Promise<SyncResult> {
  const timestamp = new Date().toISOString();

  try {
    // Check if wallet exists
    const { data: existingWallet, error: walletCheckError } = await supabase
      .from('wallets')
      .select('id')
      .eq('supervisor_id', supervisor.id)
      .single();

    if (walletCheckError && walletCheckError.code !== 'PGRST116') {
      throw new Error(`Wallet check failed: ${walletCheckError.message}`);
    }

    let action: 'created' | 'updated' | 'synced' = 'synced';
    let walletId = existingWallet?.id;

    // If wallet doesn't exist, create it
    if (!existingWallet) {
      walletId = `wallet-${supervisor.id}-${Date.now()}`;

      const { error: createError } = await supabase.from('wallets').insert([
        {
          id: walletId,
          supervisor_id: supervisor.id,
          total_fees: 0,
          total_installments_collected: 0,
          total_balance: 0,
          pending_debt: 0,
          last_updated: timestamp,
          created_at: timestamp,
        },
      ]);

      if (createError) {
        throw new Error(`Failed to create wallet: ${createError.message}`);
      }

      action = 'created';
    }

    // Log the sync
    const logId = `sync-${supervisor.id}-${Date.now()}`;
    await supabase.from('supervisor_wallet_sync_logs').insert([
      {
        id: logId,
        supervisor_id: supervisor.id,
        supervisor_name: supervisor.name,
        action,
        new_values: { wallet_id: walletId },
        sync_timestamp: timestamp,
        created_at: timestamp,
      },
    ]);

    return {
      success: true,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      walletId,
      action,
      timestamp,
      message: `✅ Wallet ${action} for ${supervisor.name}`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Sync failed for ${supervisor.name}:`, err);

    return {
      success: false,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      action: 'synced',
      timestamp,
      message: `❌ Sync failed: ${errorMsg}`,
      error: errorMsg,
    };
  }
}

/**
 * Sync all supervisors with their wallets (batch operation)
 */
export async function syncAllSupervisorsWithWallets(): Promise<SyncResult[]> {
  try {
    // Fetch all supervisors
    const { data: supervisors, error: fetchError } = await supabase
      .from('supervisors')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Failed to fetch supervisors:', fetchError);
      throw new Error(`Fetch failed: ${fetchError.message}`);
    }

    if (!supervisors || supervisors.length === 0) {
      console.log('ℹ️ No supervisors found to sync');
      return [];
    }

    console.log(`🔄 Syncing ${supervisors.length} supervisors...`);

    // Sync each supervisor with delay to avoid rate limiting
    const results: SyncResult[] = [];
    for (const supervisor of supervisors) {
      const result = await syncSupervisorWithWallet(
        supervisor as SupervisorData
      );
      results.push(result);

      // Add small delay between syncs
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Synced ${successCount}/${results.length} supervisors`);

    return results;
  } catch (err) {
    console.error('❌ Batch sync failed:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// TRANSACTION FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Add transaction to supervisor wallet
 */
export async function addWalletTransaction(
  supervisorId: string,
  transaction: Omit<WalletTransaction, 'id' | 'created_at'>
): Promise<WalletTransaction | null> {
  try {
    const transactionId = `trans-${supervisorId}-${Date.now()}`;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert([
        {
          id: transactionId,
          supervisor_id: supervisorId,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          order_id: transaction.order_id,
          approved_by: transaction.approved_by,
          gps_lat: transaction.gps_lat,
          gps_lng: transaction.gps_lng,
          created_at: now,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to add transaction:', error);
      return null;
    }

    // Update wallet balance
    await updateWalletBalance(supervisorId);

    return data as WalletTransaction;
  } catch (err) {
    console.error('❌ Transaction add failed:', err);
    return null;
  }
}

/**
 * Calculate wallet balance from all transactions
 */
export async function calculateWalletBalance(
  supervisorId: string
): Promise<{
  totalFees: number;
  totalCollected: number;
  totalBalance: number;
  pendingDebt: number;
} | null> {
  try {
    const { data: transactions, error } = await supabase
      .from('wallet_transactions')
      .select('type, amount')
      .eq('supervisor_id', supervisorId);

    if (error) {
      console.error('❌ Failed to fetch transactions:', error);
      return null;
    }

    let totalFees = 0;
    let totalCollected = 0;

    (transactions as Array<{ type: string; amount: number }>)?.forEach(t => {
      if (t.type === 'fee') {
        totalFees += t.amount;
      } else if (t.type === 'installment') {
        totalCollected += t.amount;
      }
    });

    const totalBalance = totalFees + totalCollected;

    return {
      totalFees,
      totalCollected,
      totalBalance,
      pendingDebt: totalBalance, // Pending until settled
    };
  } catch (err) {
    console.error('❌ Balance calculation failed:', err);
    return null;
  }
}

/**
 * Update wallet balance in database
 */
export async function updateWalletBalance(
  supervisorId: string
): Promise<SupervisorWalletData | null> {
  try {
    // Calculate balance
    const balance = await calculateWalletBalance(supervisorId);
    if (!balance) {
      return null;
    }

    // Update wallet
    const { data, error } = await supabase
      .from('wallets')
      .update({
        total_fees: balance.totalFees,
        total_installments_collected: balance.totalCollected,
        total_balance: balance.totalBalance,
        pending_debt: balance.pendingDebt,
        last_updated: new Date().toISOString(),
      })
      .eq('supervisor_id', supervisorId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update wallet:', error);
      return null;
    }

    return data as SupervisorWalletData;
  } catch (err) {
    console.error('❌ Wallet update failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// AUDIT & MONITORING FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Get sync history for a supervisor
 */
export async function getSyncHistory(
  supervisorId: string,
  limit = 50
): Promise<SyncAuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('supervisor_wallet_sync_logs')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch sync history:', error);
      return [];
    }

    return (data as SyncAuditLog[]) || [];
  } catch (err) {
    console.error('❌ Sync history fetch failed:', err);
    return [];
  }
}

/**
 * Get all sync logs (admin view)
 */
export async function getAllSyncLogs(limit = 100): Promise<SyncAuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('supervisor_wallet_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch sync logs:', error);
      return [];
    }

    return (data as SyncAuditLog[]) || [];
  } catch (err) {
    console.error('❌ Sync logs fetch failed:', err);
    return [];
  }
}

/**
 * Get wallet summary with transactions count
 */
export async function getWalletSummary(supervisorId: string): Promise<{
  wallet: SupervisorWalletData | null;
  transactionCount: number;
  lastTransaction?: WalletTransaction;
} | null> {
  try {
    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('❌ Wallet fetch failed:', walletError);
      return null;
    }

    // Get transactions count
    const { count, error: countError } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('supervisor_id', supervisorId);

    if (countError) {
      console.warn('⚠️ Transaction count fetch warning:', countError);
    }

    // Get last transaction
    const { data: lastTrans } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      wallet: wallet as SupervisorWalletData | null,
      transactionCount: count || 0,
      lastTransaction: lastTrans as WalletTransaction | undefined,
    };
  } catch (err) {
    console.error('❌ Wallet summary fetch failed:', err);
    return null;
  }
}

/**
 * Export sync results to CSV format
 */
export function exportSyncResultsToCSV(results: SyncResult[]): string {
  const headers = [
    'Supervisor ID',
    'Supervisor Name',
    'Wallet ID',
    'Action',
    'Status',
    'Timestamp',
    'Message',
  ];

  const rows = results.map(r => [
    r.supervisorId,
    r.supervisorName,
    r.walletId || 'N/A',
    r.action,
    r.success ? 'OK' : 'FAILED',
    r.timestamp,
    r.message,
  ]);

  const csv =
    [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n') + '\n';

  return csv;
}

/**
 * Export wallet summary to CSV
 */
export async function exportWalletSummaryToCSV(): Promise<string> {
  try {
    // Fetch all wallets with supervisor info
    const { data, error } = await supabase
      .from('supervisor_wallet_summary')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Failed to fetch wallet summary:', error);
      return '';
    }

    const headers = [
      'Supervisor ID',
      'Name',
      'Email',
      'Wallet ID',
      'Total Fees',
      'Total Collected',
      'Total Balance',
      'Pending Debt',
      'Transactions',
    ];

    const rows = (data || []).map((row: Record<string, unknown>) => [
      row.id,
      row.name,
      row.email,
      row.wallet_id || 'N/A',
      row.total_fees || 0,
      row.total_installments_collected || 0,
      row.total_balance || 0,
      row.pending_debt || 0,
      row.transaction_count || 0,
    ]);

    const csv =
      [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n') + '\n';

    return csv;
  } catch (err) {
    console.error('❌ Export failed:', err);
    return '';
  }
}
