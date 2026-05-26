import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, AlertCircle, RefreshCw, Save, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSupervisors, type SupervisorData } from '@/lib/supabaseAdmin';
import { logAuditEntry } from '@/lib/supabaseSync';
import { toast } from 'sonner';

export default function AdminSupervisors() {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState<SupervisorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SupervisorData>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      console.log('[v0] Supervisors loaded from Supabase:', data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(t('فشل في تحميل بيانات المشرفين', 'Failed to load supervisors'));
      console.error('[v0] Load supervisors error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSupervisor(supervisor: SupervisorData) {
    setEditingId(supervisor.id);
    setEditForm({ ...supervisor });
  }

  async function handleSaveEdit() {
    if (!user || !editingId) return;

    setActionLoading(editingId);
    try {
      const { supabase } = await import('@/lib/supabase');
      const updatedSupervisor = { ...editForm, updated_at: new Date().toISOString() };
      
      const { error } = await supabase
        .from('supervisors')
        .update(updatedSupervisor)
        .eq('id', editingId);

      if (error) throw error;

      // Log audit entry
      const oldSupervisor = supervisors.find(s => s.id === editingId);
      await logAuditEntry(
        'SUPERVISOR_UPDATE',
        'SUPERVISOR',
        editingId,
        user.id,
        user.name || 'Admin',
        oldSupervisor || {},
        editForm
      );

      await loadSupervisors();
      setEditingId(null);
      setEditForm({});
      toast.success(t('تم تحديث بيانات المشرف', 'Supervisor updated successfully'));
    } catch (err) {
      console.error('[v0] Edit supervisor error:', err);
      toast.error(t('فشل تحديث المشرف', 'Failed to update supervisor'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteSupervisor(supervisor: SupervisorData) {
    if (!user || !confirm(t('هل أنت متأكد من حذف هذا المشرف؟', 'Are you sure you want to delete this supervisor?'))) return;

    setActionLoading(supervisor.id);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('supervisors')
        .delete()
        .eq('id', supervisor.id);

      if (error) throw error;

      // Log audit entry
      await logAuditEntry(
        'SUPERVISOR_DELETE',
        'SUPERVISOR',
        supervisor.id,
        user.id,
        user.name || 'Admin',
        supervisor,
        {}
      );

      await loadSupervisors();
      toast.success(t('تم حذف المشرف', 'Supervisor deleted successfully'));
    } catch (err) {
      console.error('[v0] Delete supervisor error:', err);
      toast.error(t('فشل حذف المشرف', 'Failed to delete supervisor'));
    } finally {
      setActionLoading(null);
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
              {editingId === supervisor.id ? (
                // Edit Form
                <div className="space-y-4">
                  <h3 className="font-bold text-[#0f2460]">{t('تعديل بيانات المشرف', 'Edit Supervisor')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={t('الاسم', 'Name')}
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20 text-sm"
                    />
                    <input
                      type="email"
                      placeholder={t('البريد الإلكتروني', 'Email')}
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20 text-sm"
                    />
                    <input
                      type="tel"
                      placeholder={t('الهاتف', 'Phone')}
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20 text-sm"
                    />
                    <input
                      type="text"
                      placeholder={t('المحافظة', 'Province')}
                      value={editForm.province || ''}
                      onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={actionLoading === supervisor.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <Save size={14} />
                      {t('حفظ', 'Save')}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditForm({});
                      }}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300 transition flex items-center gap-1"
                    >
                      <X size={14} />
                      {t('إلغاء', 'Cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <>
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
                    <button
                      onClick={() => handleEditSupervisor(supervisor)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0f2460] text-white text-sm font-semibold hover:bg-[#0f2460]/90 transition flex items-center justify-center gap-1"
                    >
                      <Edit size={14} />
                      {t('تعديل', 'Edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteSupervisor(supervisor)}
                      disabled={actionLoading === supervisor.id}
                      className="flex-1 px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {t('حذف', 'Delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
