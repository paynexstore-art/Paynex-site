/**
 * WhatsApp API Integration — PayNex
 *
 * Placeholder for WhatsApp Business API (Meta / Twilio / 360dialog).
 * Provides auto-reminders, late alerts, and thank-you messages.
 */

import type { WhatsAppLog } from '@/types';

const API_BASE = import.meta.env.VITE_WHATSAPP_API_URL || '';
const API_KEY = import.meta.env.VITE_WHATSAPP_API_KEY || '';

export interface WhatsAppMessage {
  to: string;          // E.164 format e.g. +2010xxxx
  template: string;
  language: 'ar' | 'en';
  params: string[];
}

const TEMPLATES: Record<WhatsAppLog['template'], { ar: string; en: string }> = {
  installment_reminder: {
    ar: 'تذكير: قسطك الشهري بقيمة {{1}} ج.م مستحق بتاريخ {{2}}. رقم الطلب: {{3}}. شكراً لاستخدامك باينكس.',
    en: 'Reminder: your monthly installment of {{1}} EGP is due on {{2}}. Order #{{3}}. Thank you for choosing PayNex.',
  },
  late_alert: {
    ar: 'تنبيه: تأخر سداد قسطك الشهري {{1}} ج.م لطلب {{2}}. يرجى السداد فوراً لتجنب الإجراءات القانونية.',
    en: 'Alert: overdue monthly installment {{1}} EGP for order {{2}}. Please settle immediately to avoid legal action.',
  },
  thank_you: {
    ar: 'شكراً لثقتك في باينكس! تم تسليم طلبك {{1}} بنجاح. نتمنى لك تجربة ممتازة.',
    en: 'Thank you for trusting PayNex! Your order {{1}} has been delivered successfully. Enjoy!',
  },
  admin_approval: {
    ar: 'تمت الموافقة على طلبك {{1}} من قبل الإدارة. سيقوم المشرف بالتواصل لتحديد موعد التوصيل.',
    en: 'Your order {{1}} has been approved by management. A supervisor will contact you to schedule delivery.',
  },
  doc_request: {
    ar: 'يرجى رفع المستندات المطلوبة (بطاقة الرقم القومي، فاتورة المرافق، إثبات دخل) لاستكمال طلبك {{1}}.',
    en: 'Please upload required documents (National ID, utility bill, income proof) to complete your order {{1}}.',
  },
};

/**
 * Send a WhatsApp message using the configured provider.
 * In demo mode, logs to console and localStorage.
 */
export async function sendWhatsAppMessage(
  message: WhatsAppMessage
): Promise<{ success: boolean; log: WhatsAppLog; error?: string }> {
  const now = new Date().toISOString();
  const log: WhatsAppLog = {
    id: `wa-${Date.now()}`,
    orderId: message.params[2] || 'unknown',
    phone: message.to,
    template: message.template as WhatsAppLog['template'],
    body: renderTemplate(TEMPLATES[message.template as WhatsAppLog['template']][message.language], message.params),
    status: 'queued',
    sentAt: now,
  };

  try {
    if (!API_BASE || !API_KEY) {
      // Demo mode: simulate success after 300ms
      await new Promise(r => setTimeout(r, 300));
      log.status = 'sent';
      storeLog(log);
      console.log('[WhatsApp Demo]', log.body);
      return { success: true, log };
    }

    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(message),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    log.status = 'sent';
    storeLog(log);
    return { success: true, log };
  } catch (err) {
    log.status = 'failed';
    log.errorMessage = err instanceof Error ? err.message : 'Unknown error';
    storeLog(log);
    return { success: false, log, error: log.errorMessage };
  }
}

function renderTemplate(template: string, params: string[]): string {
  return params.reduce((str, val, i) => str.replace(`{{${i + 1}}}`, val), template);
}

function storeLog(log: WhatsAppLog): void {
  const key = 'paynex_whatsapp_logs';
  const existing = (() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]') as WhatsAppLog[]; } catch { return []; }
  })();
  existing.unshift(log);
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 500)));
}

export function getWhatsAppLogs(): WhatsAppLog[] {
  try { return JSON.parse(localStorage.getItem('paynex_whatsapp_logs') || '[]') as WhatsAppLog[]; } catch { return []; }
}

/**
 * Schedule automatic reminders for an order.
 */
export function scheduleInstallmentReminders(
  orderId: string,
  phone: string,
  monthlyAmount: number,
  dueDates: string[]
): void {
  dueDates.forEach(date => {
    // In a real app, use a cron job or serverless function.
    // Here we just log the intended schedule.
    console.log(`[WhatsApp Schedule] Reminder for ${phone} on ${date} amount ${monthlyAmount} order ${orderId}`);
  });
}
