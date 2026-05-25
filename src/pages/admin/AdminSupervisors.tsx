import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSupervisors, type SupervisorData } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';

export default function AdminSupervisors() {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState<SupervisorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Fetch supervisors on component mount
  useEffect(() => {
    loadSupervisors();
  }, []);

  async function loadSupervisors() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSupervisors();
      setSupervisors(data);
      console.log('✅ Supervisors loaded from Supabase:', data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(t('فشل في تحميل بيانات المشرفين', 'Failed to load supervisors'));
      console.error('❌ Load supervisors error:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = supervisors.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.province.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
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
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-900 text-sm font-medium">{error}</p>
            <button
              onClick={loadSupervisors}
              className="text-red-700 hover:underline text-xs mt-1"
            >
              {t('حاول مرة أخرى', 'Try again')}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0f2460]">{t('المشرفون', 'Supervisors')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {t(`إجمالي: ${supervisors.length} مشرف`, `Total: ${supervisors.length} supervisors`)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadSupervisors}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
            title={t('تحديث', 'Refresh')}
          >
            <RefreshCw size={18} className="text-[#0f2460]" />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t('ابحث عن مشرف...', 'Search supervisors...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
          />
        </div>
      </div>

      {/* Supervisors List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <p className="text-slate-400">{t('لا توجد بيانات', 'No data')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((supervisor) => (
            <div
              key={supervisor.id}
              className="bg-white rounded-2xl shadow-card p-5 border border-slate-100 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-[#0f2460] mb-1">{supervisor.name}</h3>
                  <p className="text-sm text-slate-500">{supervisor.email}</p>
                  <p className="text-xs text-slate-400 mt-1">{supervisor.phone}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                      supervisor.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {supervisor.is_active ? t('نشط', 'Active') : t('معطل', 'Inactive')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-t border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">{t('المحافظة', 'Province')}</p>
                  <p className="font-semibold text-sm text-[#0f2460]">{supervisor.province}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t('ساعات العمل', 'Work Hours')}</p>
                  <p className="font-semibold text-sm text-[#0f2460]">
                    {supervisor.work_hours_start || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t('التاريخ', 'Created')}</p>
                  <p className="font-semibold text-sm text-[#0f2460]">
                    {new Date(supervisor.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t('الحالة', 'Status')}</p>
                  <p className="font-semibold text-sm">{supervisor.is_active ? '✓' : '✗'}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button className="flex-1 px-3 py-2 rounded-lg bg-[#0f2460] text-white text-sm font-semibold hover:bg-[#0f2460]/90 transition flex items-center justify-center gap-1">
                  <Edit size={14} />
                  {t('تعديل', 'Edit')}
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg bg-slate-100 text-[#0f2460] text-sm font-semibold hover:bg-slate-200 transition flex items-center justify-center gap-1">
                  <Trash2 size={14} />
                  {t('حذف', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
