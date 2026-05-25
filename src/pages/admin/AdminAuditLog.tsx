import { useState, useEffect } from 'react';
import { Shield, Search, Filter, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { fetchAuditLogs, fetchAuditLogsByEntity, type AuditLogEntry } from '@/lib/supabaseAdmin';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  order: <Shield size={13} className="text-green-500" />,
  wallet: <Shield size={13} className="text-[#d4a339]" />,
  settings: <Shield size={13} className="text-blue-500" />,
  auth: <Shield size={13} className="text-purple-500" />,
  supervisor: <Shield size={13} className="text-orange-500" />,
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[#d4a339] text-[#0f2460]',
  supervisor: 'bg-blue-100 text-blue-700',
  customer: 'bg-green-100 text-green-700',
};

export default function AdminAuditLog() {
  const { t, lang } = useApp();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch audit logs on component mount
  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditLogs();
      setLogs(data);
      console.log('✅ Audit logs loaded from Supabase:', data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(t('فشل في تحميل سجل المراجعة', 'Failed to load audit log'));
      console.error('❌ Load audit logs error:', err);
    } finally {
      setLoading(false);
    }
  }

  const entities = ['all', 'order', 'wallet', 'settings', 'auth', 'supervisor'];
  const filtered = logs.filter((l) => {
    const matchSearch = !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.user_name.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === 'all' || l.entity === entityFilter;
    return matchSearch && matchEntity;
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="inline-block mb-3">
            <RefreshCw size={24} className="text-[#0f2460] animate-spin" />
          </div>
          <p className="text-slate-500">{t('جاري التحميل...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-3 flex items-center gap-2 text-sm text-[#0f2460]">
        <Shield size={15} className="text-[#d4a339] flex-shrink-0" />
        {t(
          'سجل المراجعة غير قابل للحذف — يسجل كل عملية في النظام بشكل تلقائي',
          'Audit log is append-only — records every system action automatically'
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-900 text-sm font-medium">{error}</p>
            <button onClick={loadAuditLogs} className="text-red-700 hover:underline text-xs mt-1">
              {t('حاول مرة أخرى', 'Try again')}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('إجمالي السجلات', 'Total Records'), value: logs.length },
          { label: t('أحداث الدخول', 'Auth Events'), value: logs.filter((l) => l.entity === 'auth').length },
          { label: t('تغييرات الطلبات', 'Order Changes'), value: logs.filter((l) => l.entity === 'order').length },
          { label: t('معاملات المحفظة', 'Wallet Transactions'), value: logs.filter((l) => l.entity === 'wallet').length },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-6 border border-slate-100">
            <div className="text-2xl font-black text-[#0f2460]">{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t('ابحث في السجلات...', 'Search logs...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20 text-sm"
        >
          {entities.map((e) => (
            <option key={e} value={e}>
              {e === 'all' ? t('الكل', 'All') : e}
            </option>
          ))}
        </select>
        <button
          onClick={loadAuditLogs}
          className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
          title={t('تحديث', 'Refresh')}
        >
          <RefreshCw size={18} className="text-[#0f2460]" />
        </button>
      </div>

      {/* Logs List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <p className="text-slate-400">{t('لا توجد سجلات', 'No logs')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id} className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="text-lg">{ENTITY_ICONS[log.entity] || '📝'}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0f2460] text-sm">{log.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('بواسطة:', 'By:')} {log.user_name} • {formatTime(log.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      ROLE_COLORS[log.entity] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {log.entity.toUpperCase()}
                  </span>
                  {expandedId === log.id ? (
                    <ChevronUp size={18} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400" />
                  )}
                </div>
              </button>

              {expandedId === log.id && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {log.before && (
                      <div>
                        <p className="font-semibold text-slate-700 mb-2">{t('قبل', 'Before')}:</p>
                        <pre className="bg-white p-3 rounded border border-slate-200 text-xs overflow-auto max-h-32 text-slate-600">
                          {JSON.stringify(JSON.parse(log.before), null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div>
                        <p className="font-semibold text-slate-700 mb-2">{t('بعد', 'After')}:</p>
                        <pre className="bg-white p-3 rounded border border-slate-200 text-xs overflow-auto max-h-32 text-slate-600">
                          {JSON.stringify(JSON.parse(log.after), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    {t('المعرف:', 'ID:')} {log.entity_id || '—'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
