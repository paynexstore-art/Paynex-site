// ============================================================
// Supabase Sync Service — Qastly
// ============================================================

import { supabase } from './supabase';

/**
 * Settings Sync Structure
 */
export interface SyncSettings {
  consultation_fee: number;
  installment_rate: number;
  installment_months: number;
  max_installment_amount: number;
  admin_commission_percentage: number;
  [key: string]: unknown;
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  changes: Record<string, { old?: unknown; new?: unknown }>;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  createdAt: string;
  ipAddress?: string;
}

/**
 * Sync status tracker
 */
export interface SyncStatus {
  lastSyncTime: string;
  isOnline: boolean;
  pendingChanges: number;
  lastError?: string;
}

// Local storage prefix
const STORAGE_PREFIX = 'qastly_';

/**
 * Save settings with dual storage (localStorage + Supabase)
 */
export async function saveSettingsWithSync(
  key: string,
  value: unknown,
  userId: string,
  userName: string = 'system'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Save to localStorage first (for immediate access)
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    
    // Create audit log entry
    const auditEntry: Omit<AuditLogEntry, 'id'> = {
      action: 'UPDATE_SETTINGS',
      entityType: 'SETTINGS',
      entityId: key,
      userId,
      userName,
      changes: {},
      oldValues: {},
      newValues: value as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    };

    // Save to Supabase
    const { error: settingsError } = await supabase
      .from('site_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }, {
        onConflict: 'key'
      });

    if (settingsError) {
      console.error('[v0] Error saving settings to Supabase:', settingsError);
      return { success: false, error: settingsError.message };
    }

    // Save audit log
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([auditEntry]);

    if (auditError) {
      console.error('[v0] Error saving audit log:', auditError);
    }

    // Update sync status
    updateSyncStatus({ lastSyncTime: new Date().toISOString(), isOnline: true, pendingChanges: 0 });

    return { success: true };
  } catch (error) {
    console.error('[v0] Error in saveSettingsWithSync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateSyncStatus({ lastSyncTime: new Date().toISOString(), isOnline: false, lastError: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get settings from dual storage (check Supabase first, fallback to localStorage)
 */
export async function getSettingsWithSync(key: string): Promise<SyncSettings | null> {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (!error && data) {
      // Save to localStorage for offline access
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data.value));
      updateSyncStatus({ lastSyncTime: new Date().toISOString(), isOnline: true, pendingChanges: 0 });
      return data.value;
    }

    // Fallback to localStorage
    const localData = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (localData) {
      return JSON.parse(localData);
    }

    return null;
  } catch (error) {
    console.error('[v0] Error fetching settings:', error);
    
    // Last resort: return from localStorage
    const localData = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return localData ? JSON.parse(localData) : null;
  }
}

/**
 * Create audit log entry
 */
export async function logAuditEntry(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  userName: string,
  oldValues: Record<string, unknown> = {},
  newValues: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const auditEntry: Omit<AuditLogEntry, 'id'> = {
      action,
      entityType,
      entityId,
      userId,
      userName,
      changes: Object.keys(newValues).reduce<Record<string, { old: unknown; new: unknown }>>((acc, key) => {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
          acc[key] = { old: oldValues[key], new: newValues[key] };
        }
        return acc;
      }, {}),
      oldValues,
      newValues,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert([auditEntry]);

    if (error) {
      console.error('[v0] Error logging audit entry:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[v0] Error in logAuditEntry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(
  filters?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: AuditLogEntry[]; total: number; error?: string }> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (filters?.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters?.entityId) query = query.eq('entity_id', filters.entityId);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.action) query = query.eq('action', filters.action);
    
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    query = query.order('created_at', { ascending: false });
    
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[v0] Error fetching audit logs:', error);
      return { data: [], total: 0, error: error.message };
    }

    return { data: data || [], total: count || 0 };
  } catch (error) {
    console.error('[v0] Error in getAuditLogs:', error);
    return { data: [], total: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update sync status
 */
function updateSyncStatus(status: Partial<SyncStatus>) {
  const current = getSyncStatus();
  const updated: SyncStatus = { ...current, ...status };
  localStorage.setItem(`${STORAGE_PREFIX}sync_status`, JSON.stringify(updated));
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}sync_status`);
  return stored ? JSON.parse(stored) : {
    lastSyncTime: new Date().toISOString(),
    isOnline: true,
    pendingChanges: 0,
  };
}

/**
 * Batch sync operations
 */
export async function batchSync(
  operations: Array<{
    type: 'settings' | 'audit';
    payload: Record<string, unknown> & { key?: string; value?: unknown; action?: string; entityType?: string; entityId?: string; oldValues?: Record<string, unknown>; newValues?: Record<string, unknown> };
    userId: string;
    userName: string;
  }>
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  const results = {
    successCount: 0,
    failureCount: 0,
    errors: [] as string[],
  };

  for (const op of operations) {
    try {
      if (op.type === 'settings') {
        const result = await saveSettingsWithSync(
          op.payload.key || '',
          op.payload.value as Record<string, unknown>,
          op.userId,
          op.userName
        );
        result.success ? results.successCount++ : results.failureCount++;
        if (!result.success && result.error) results.errors.push(result.error);
      } else if (op.type === 'audit') {
        const result = await logAuditEntry(
          op.payload.action || '',
          op.payload.entityType || '',
          op.payload.entityId || '',
          op.userId,
          op.userName,
          op.payload.oldValues,
          op.payload.newValues
        );
        result.success ? results.successCount++ : results.failureCount++;
        if (!result.success && result.error) results.errors.push(result.error);
      }
    } catch (error) {
      results.failureCount++;
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return results;
}

/**
 * Clear all local sync data (use with caution)
 */
export function clearLocalSyncData() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
