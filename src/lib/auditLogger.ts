// src/lib/auditLogger.ts
import { supabaseAdmin } from './supabase'

export async function logActivity(params: {
  userId: string
  userRole: string
  action: string
  entityType?: string
  entityId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: params.userId,
      user_role: params.userRole,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      old_value: params.oldValue,
      new_value: params.newValue,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    })
  } catch (error) {
    console.error('Audit Log Error:', error)
  }
  // لا يوجد خطأ يوقف العملية - السجل يعمل بشكل صامت
}
