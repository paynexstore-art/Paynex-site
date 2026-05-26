import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fetchSupervisors } from '@/lib/supabaseAdmin';
import {
  syncAllSupervisorsWithWallets,
  syncSupervisorWithWallet,
  getAllSyncLogs,
  getWalletSummary,
  exportSyncResultsToCSV,
  exportWalletSummaryToCSV,
  type SyncResult,
  type SyncAuditLog,
} from '@/lib/supervisorWalletSync';
import {
  Wallet,
  RefreshCw,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const SYNC_STATUS_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  synced: 'bg-yellow-100 text-yellow-700',
};

export default function SupervisorWalletSyncPanel() {
  const { t, lang } = useApp();
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedSyncId, setExpandedSyncId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const sups = await fetchSupervisors();
      setSupervisors(sups);

      const logs = await getAllSyncLogs(50);
      setSyncLogs(logs);
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      toast.error(t('فشل في تحميل البيانات', 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncAll() {
    try {
      setSyncing(true);
      toast.loading(
        t('جاري المزامنة...', 'Syncing supervisors...'),
        { duration: 5000 }
      );

      const results = await syncAllSupervisorsWithWallets();
      setSyncResults(results);

      const successCount = results.filter(r => r.success).length;
      toast.success(
        t(
          `تم مزامنة ${successCount}/${results.length} مشرفين`,
          `Synced ${successCount}/${results.length} supervisors`
        )
      );

      // Reload sync logs
      const logs = await getAllSyncLogs(50);
      setSyncLogs(logs);
    } catch (err) {
      console.error('❌ Sync failed:', err);
      toast.error(
        t('فشلت المزامنة', 'Sync failed')
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleSingleSync(supervisorId: string) {
    try {
      const supervisor = supervisors.find(s => s.id === supervisorId);
      if (!supervisor) {
        toast.error(t('المشرف غير موجود', 'Supervisor not found'));
        return;
      }

      toast.loading(
        t('جاري المزامنة...', 'Syncing...'),
        { duration: 3000 }
      );

      const result = await syncSupervisorWithWallet(supervisor);

      if (result.success) {
        toast.success(result.message);
        const logs = await getAllSyncLogs(50);
        setSyncLogs(logs);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('❌ Single sync failed:', err);
      toast.error(t('فشلت المزامنة', 'Sync failed'));
    }
  }

  async function handleExportResults() {
    try {
      if (syncResults.length === 0) {
        toast.error(
          t('لا توجد نتائج للتصدير', 'No results to export')
        );
        return;
      }

      const csv = exportSyncResultsToCSV(syncResults);
      downloadCSV(
        csv,
        `sync-results-${Date.now()}.csv`
      );
      toast.success(
        t('تم التصدير بنجاح', 'Exported successfully')
      );
    } catch (err) {
      console.error('❌ Export failed:', err);
      toast.error(t('فشل التصدير', 'Export failed'));
    }
  }

  async function handleExportWallets() {
    try {
      toast.loading(
        t('جاري التصدير...', 'Exporting...'),
        { duration: 3000 }
      );

      const csv = await exportWalletSummaryToCSV();
      if (!csv) {
        toast.error(t('فشل التصدير', 'Export failed'));
        return;
      }

      downloadCSV(
        csv,
        `wallet-summary-${Date.now()}.csv`
      );
      toast.success(
        t('تم التصدير بنجاح', 'Exported successfully')
      );
    } catch (err) {
      console.error('❌ Export failed:', err);
      toast.error(t('فشل التصدير', 'Export failed'));
    }
  }

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredResults = syncResults.filter(
    r =>
      r.supervisorName.toLowerCase().includes(search.toLowerCase()) ||
      r.supervisorId.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = syncLogs.filter(log =>
    log.supervisor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wallet size={32} className="text-[#d4a339]" />
        <div>
          <h1 className="text-3xl font-bold text-[#0f2460]">
            {lang === 'ar' ? 'مزامنة المحافظ' : 'Wallet Synchronization'}
          </h1>
          <p className="text-slate-600 text-sm">
            {lang === 'ar'
              ? 'مزامنة المشرفين مع محافظهم التلقائية'
              : 'Automatic supervisor-wallet synchronization'}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
        <p className="text-blue-800 text-sm">
          {lang === 'ar'
            ? 'اضغط "مزامنة الجميع" لمزامنة جميع المشرفين مع محافظهم في Supabase'
            : 'Click "Sync All" to synchronize all supervisors with their wallets in Supabase'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={handleSyncAll}
          disabled={syncing || supervisors.length === 0}
          className="bg-[#d4a339] hover:bg-[#c09329] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
          {lang === 'ar' ? 'مزامنة الجميع' : 'Sync All'}
        </button>

        <button
          onClick={handleExportResults}
          disabled={syncResults.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Download size={20} />
          {lang === 'ar' ? 'تصدير النتائج' : 'Export Results'}
        </button>

        <button
          onClick={handleExportWallets}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Download size={20} />
          {lang === 'ar' ? 'تصدير المحافظ' : 'Export Wallets'}
        </button>

        <button
          onClick={loadData}
          disabled={loading}
          className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          {lang === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#0f2460]">
              {lang === 'ar' ? 'نتائج المزامنة' : 'Sync Results'}
            </h2>
            <span className="text-sm text-slate-600">
              {syncResults.filter(r => r.success).length}/
              {syncResults.length}{' '}
              {lang === 'ar' ? 'نجحت' : 'succeeded'}
            </span>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              type="text"
              placeholder={
                lang === 'ar' ? 'البحث...' : 'Search...'
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    {lang === 'ar' ? 'المشرف' : 'Supervisor'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    {lang === 'ar' ? 'الإجراء' : 'Action'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    {lang === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    {lang === 'ar' ? 'الرسالة' : 'Message'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(result => (
                  <tr
                    key={result.supervisorId}
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4">{result.supervisorName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          SYNC_STATUS_COLORS[result.action]
                        }`}
                      >
                        {result.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {result.success ? (
                        <span className="text-green-600 font-semibold">
                          ✅ OK
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          ❌ FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {result.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sync Logs */}
      {syncLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-bold text-[#0f2460] mb-4">
            {lang === 'ar' ? 'سجل المزامنة' : 'Sync Log'}
          </h2>

          <div className="space-y-2">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 cursor-pointer"
                onClick={() =>
                  setExpandedSyncId(
                    expandedSyncId === log.id ? null : log.id
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0f2460]">
                      {log.supervisor_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {new Date(
                        log.sync_timestamp
                      ).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        SYNC_STATUS_COLORS[log.action]
                      }`}
                    >
                      {log.action}
                    </span>
                    {expandedSyncId === log.id ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {expandedSyncId === log.id && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {syncResults.length === 0 && syncLogs.length === 0 && (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Wallet size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">
            {lang === 'ar'
              ? 'اضغط "مزامنة الجميع" لبدء المزامنة'
              : 'Click "Sync All" to start synchronization'}
          </p>
        </div>
      )}
    </div>
  );
}
