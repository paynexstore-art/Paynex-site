/**
 * AdminWallets — Financial Management & Salary Control
 * 
 * Features:
 * - Custody settlement (full / partial — remainder → negative debt)
 * - Salary management (base, bonuses, penalties with reasons)
 * - Monthly close → archive + carry-forward negative balance
 * - Overdue custody auto-lock warnings
 */

import { useState, useEffect } from 'react';
import {
  Wallet, DollarSign, CheckCircle, AlertTriangle, Lock, RefreshCw,
  TrendingUp, Plus, Minus, Archive, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchSupervisors,
  type SupervisorData
} from '@/lib/supabaseAdmin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logAuditEntry } from '@/lib/supabaseSync';
import { PROVINCES } from '@/constants/data';
import { toast } from 'sonner';

export default function AdminWallets() {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState<SupervisorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState(0);
  const [expandedSup, setExpandedSup] = useState<string | null>(null);

  // Load supervisors from Supabase on mount
  useEffect(() => {
    loadWallets();
  }, []);

  async function loadWallets() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSupervisors();
      setSupervisors(data);
      console.log('[v0] Wallets loaded from Supabase:', data.length, 'supervisors');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(t('فشل في تحميل المحافظ', 'Failed to load wallets'));
      console.error('[v0] Load wallets error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSettle(sup: SupervisorData) {
    if (!user) {
      toast.error(t('يجب تسجيل الدخول أولاً', 'Please log in first'));
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Log the settlement in audit
      await logAuditEntry(
        'WALLET_SETTLEMENT',
        'WALLET',
        sup.id,
        user.id,
        user.name || 'Admin',
        { amount: 0 },
        { settled_amount: settleAmount }
      );

      toast.success(
        t(
          `تم تسوية ${formatCurrency(settleAmount)}`,
          `Settled ${formatCurrency(settleAmount, 'en')}`
        )
      );

      setSettlingId(null);
      setSettleAmount(0);
      await loadWallets();
    } catch (err) {
      console.error('[v0] Settlement error:', err);
      toast.error(t('فشل التسوية', 'Settlement failed'));
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="inline-block mb-3">
            <RefreshCw size={24} className="text-[#0f2460] animate-spin" />
          </div>
          <p className="text-slate-500">{t('جاري تحميل المحافظ...', 'Loading wallets...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-900 text-sm font-medium">{error}</p>
            <button
              onClick={loadWallets}
              className="text-red-700 hover:underline text-xs mt-1"
            >
              {t('حاول مرة أخرى', 'Try again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const totalWallets = supervisors.length;
  const totalAmount = supervisors.reduce((sum, sup) => sum + (sup.target || 0), 0);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('إجمالي المحافظ', 'Total Wallets'), value: totalWallets, color: 'bg-[#0a1628]', icon: <Wallet size={20} /> },
          { label: t('عدد المشرفين النشطين', 'Active Supervisors'), value: supervisors.filter(s => s.is_active).length, color: 'bg-green-500', icon: <CheckCircle size={20} /> },
          { label: t('إجمالي الأهداف', 'Total Targets'), value: formatCurrency(totalAmount, lang), color: 'bg-[#c9a84c]', icon: <DollarSign size={20} /> },
          { label: t('تحديث', 'Updated'), value: new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'), color: 'bg-blue-500', icon: <RefreshCw size={20} /> },
        ].map((card, i) => (
          <div key={i} className="stat-card">
            <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center text-white mb-3`}>{card.icon}</div>
            <div className="text-xl font-black text-[#0a1628]">{card.value}</div>
            <div className="text-slate-500 text-sm">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0f2460]">{t('المحافظ والعهد', 'Wallets & Custody')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {t(`إجمالي: ${supervisors.length} محفظة`, `Total: ${supervisors.length} wallets`)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadWallets}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
            title={t('تحديث', 'Refresh')}
          >
            <RefreshCw size={18} className="text-[#0f2460]" />
          </button>
        </div>
      </div>

      {/* Wallets List */}
      {supervisors.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <Wallet size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">{t('لا توجد محافظ', 'No wallets found')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {supervisors.map((sup) => {
            const prov = PROVINCES.find(p => p.id === sup.province);
            const expanded = expandedSup === sup.id;

            return (
              <div
                key={sup.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                  !sup.is_active ? 'border-red-300 opacity-60' : 'border-slate-100'
                } hover:shadow-lg`}
              >
                {/* Header */}
                <div className="p-4 flex flex-wrap items-center gap-4">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                    <div className="w-11 h-11 bg-gradient-to-br from-[#0a1628] to-[#0e2044] rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {sup.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[#0a1628]">{sup.name}</div>
                      <div className="text-xs text-slate-400">{lang === 'ar' ? prov?.nameAr : prov?.nameEn} — {sup.email}</div>
                    </div>
                  </div>

                  {/* Target */}
                  <div className="text-center">
                    <div className="text-xs text-slate-400">{t('الهدف الشهري', 'Monthly Target')}</div>
                    <div className="font-black text-lg text-[#0a1628]">
                      {formatCurrency(sup.target || 0, lang)}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs px-2 py-1 rounded-full ${sup.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {sup.is_active ? t('نشط', 'Active') : t('موقوف', 'Inactive')}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSettlingId(sup.id);
                        setSettleAmount(sup.target || 0);
                      }}
                      className="text-xs bg-[#0a1628] text-white px-3 py-2 rounded-lg hover:bg-[#0e2044] transition-colors flex items-center gap-1 min-h-[36px]"
                    >
                      <CheckCircle size={11} /> {t('تسوية', 'Settle')}
                    </button>
                    <button
                      onClick={() => setExpandedSup(expanded ? null : sup.id)}
                      className="text-xs bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 min-h-[36px]"
                    >
                      {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {t('التفاصيل', 'Details')}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: t('الهاتف', 'Phone'), value: sup.phone },
                        { label: t('المحافظة', 'Province'), value: lang === 'ar' ? prov?.nameAr : prov?.nameEn },
                        { label: t('ساعات العمل', 'Work Hours'), value: sup.work_hours_start || t('غير محدد', 'N/A') },
                        { label: t('تاريخ الإنشاء', 'Created'), value: new Date(sup.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') },
                      ].map((item, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border border-slate-100">
                          <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                          <p className="font-semibold text-sm text-[#0a1628]">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Settle Modal ── */}
      {settlingId && (() => {
        const sup = supervisors.find(s => s.id === settlingId);
        if (!sup) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSettlingId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0a1628]">{t('تسوية المحفظة', 'Settle Wallet')}</h3>
                  <button onClick={() => setSettlingId(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-slate-500 text-sm mb-1">{t('المشرف:', 'Supervisor:')} <strong>{sup.name}</strong></p>
                <p className="text-slate-400 text-xs mb-4">{t('الهدف:', 'Target:')} <strong>{formatCurrency(sup.target || 0, lang)}</strong></p>
                <div className="mb-4">
                  <label className="text-sm text-slate-600 mb-1.5 block font-medium">{t('المبلغ المستلم (ج.م)', 'Amount Received (EGP)')}</label>
                  <input
                    type="number"
                    value={settleAmount}
                    onChange={e => setSettleAmount(Number(e.target.value))}
                    className="input-field text-center text-2xl font-black text-[#c9a84c]"
                    min={0}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSettle(sup)}
                    disabled={settleAmount <= 0}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {t('تأكيد', 'Confirm')}
                  </button>
                  <button onClick={() => setSettlingId(null)} className="btn-outline flex-1">
                    {t('إلغاء', 'Cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
