/**
 * Audit Log System — Qastly
 *
 * Append-only log stored in localStorage.
 * Records every significant action (login, status change, setting update, etc.)
 * Cannot be deleted by supervisors — only readable by admin.
 */

import type { AuditLog, UserRole } from '@/types';
import { generateId } from './utils';

const AUDIT_KEY = 'qastly_audit_log';
const MAX_ENTRIES = 1000; // Keep last 1000 entries

export function getAuditLogs(): AuditLog[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) ?? '[]') as AuditLog[];
  } catch {
    return [];
  }
}

export function addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const logs = getAuditLogs();
  const newEntry: AuditLog = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  // Prepend and cap at MAX_ENTRIES
  const updated = [newEntry, ...logs].slice(0, MAX_ENTRIES);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
}

/** Helper: log an order status change */
export function logOrderStatusChange(
  userId: string, userName: string, userRole: UserRole,
  orderId: string, fromStatus: string, toStatus: string, reason?: string
): void {
  addAuditLog({
    userId, userName, userRole,
    action: `تغيير حالة الطلب: ${fromStatus} → ${toStatus}${reason ? ' | السبب: ' + reason : ''}`,
    entity: 'order',
    entityId: orderId,
    before: JSON.stringify({ status: fromStatus }),
    after: JSON.stringify({ status: toStatus, reason }),
  });
}

/** Helper: log a setting change */
export function logSettingsChange(
  userId: string, userName: string, field: string, oldVal: unknown, newVal: unknown
): void {
  addAuditLog({
    userId, userName, userRole: 'admin',
    action: `تعديل إعداد: ${field}`,
    entity: 'settings',
    before: JSON.stringify({ [field]: oldVal }),
    after: JSON.stringify({ [field]: newVal }),
  });
}

/** Helper: log wallet settlement */
export function logWalletSettlement(
  adminId: string, adminName: string,
  supervisorId: string, supervisorName: string, amount: number
): void {
  addAuditLog({
    userId: adminId, userName: adminName, userRole: 'admin',
    action: `تصفير عهدة المشرف: ${supervisorName} | المبلغ: ${amount} ج.م`,
    entity: 'wallet',
    entityId: supervisorId,
    after: JSON.stringify({ settled: amount, at: new Date().toISOString() }),
  });
}

/** Helper: log login event */
export function logLogin(userId: string, userName: string, userRole: UserRole, success: boolean): void {
  addAuditLog({
    userId, userName, userRole,
    action: success ? 'تسجيل دخول ناجح' : 'محاولة دخول فاشلة',
    entity: 'auth',
    entityId: userId,
  });
}
