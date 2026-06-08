import { useState, useEffect } from 'react';
import {
  Settings, Shield, Key, Mail, Users, Lock, Unlock, Eye, EyeOff,
  Save, X, Plus, Trash2, Edit, Copy, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AdminUser {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  role: 'super_admin' | 'admin' | 'manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SuperAdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'password' | 'security'>('users');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminUser>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Create new admin
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'admin' as const,
  });

  useEffect(() => {
    loadAdminUsers();
  }, []);

  async function loadAdminUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (err) {
      console.error('Error loading admin users:', err);
      toast.error('فشل تحميل مستخدمي الإدارة');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAdmin() {
    if (!newAdminForm.email || !newAdminForm.name || !newAdminForm.password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newAdminForm.password !== newAdminForm.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert([
          {
            email: newAdminForm.email,
            name: newAdminForm.name,
            password_hash: newAdminForm.password,
            role: newAdminForm.role,
            is_active: true,
          }
        ])
        .select();

      if (error) throw error;
      
      toast.success('تم إنشاء مسؤول جديد بنجاح');
      setNewAdminForm({ email: '', name: '', password: '', confirmPassword: '', role: 'admin' });
      setShowCreateForm(false);
      await loadAdminUsers();
    } catch (err) {
      console.error('Error creating admin:', err);
      toast.error('فشل إنشاء المسؤول');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAdmin() {
    if (!editingId) return;

    setLoading(true);
    try {
      const updateData: unknown = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      };

      if (newPassword) {
        updateData.password_hash = newPassword;
      }

      const { error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', editingId);

      if (error) throw error;

      toast.success('تم تحديث بيانات المسؤول بنجاح');
      setEditingId(null);
      setEditForm({});
      setNewPassword('');
      await loadAdminUsers();
    } catch (err) {
      console.error('Error updating admin:', err);
      toast.error('فشل التحديث');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAdmin(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المسؤول؟')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف المسؤول بنجاح');
      await loadAdminUsers();
    } catch (err) {
      console.error('Error deleting admin:', err);
      toast.error('فشل الحذف');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success(isActive ? 'تم تعطيل المسؤول' : 'تم تفعيل المسؤول');
      await loadAdminUsers();
    } catch (err) {
      console.error('Error toggling admin status:', err);
      toast.error('فشل التعديل');
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-2">
        {[
          { id: 'users', label: 'مسؤولو النظام', icon: <Users size={16} /> },
          { id: 'password', label: 'كلمات المرور', icon: <Key size={16} /> },
          { id: 'security', label: 'الأمان', icon: <Shield size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === tab.id
                ? 'bg-[#0f2460] text-white'
                : 'text-slate-600 hover:text-[#0f2460]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#0f2460]">مسؤولو النظام</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 bg-[#0f2460] text-white px-4 py-2 rounded-lg hover:bg-[#0f2460]/90 transition"
            >
              <Plus size={16} />
              مسؤول جديد
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-bold text-[#0f2460]">إنشاء مسؤول جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                />
                <input
                  type="text"
                  placeholder="الاسم"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                />
                <input
                  type="password"
                  placeholder="تأكيد كلمة المرور"
                  value={newAdminForm.confirmPassword}
                  onChange={(e) => setNewAdminForm({...newAdminForm, confirmPassword: e.target.value})}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                />
                <select
                  value={newAdminForm.role}
                  onChange={(e) => setNewAdminForm({...newAdminForm, role: e.target.value as any})}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                >
                  <option value="admin">مدير</option>
                  <option value="manager">مدير حساب</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAdmin}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  إنشاء
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Admins List */}
          <div className="space-y-3">
            {adminUsers.map(admin => (
              <div key={admin.id} className="bg-white rounded-xl p-4 border border-slate-200">
                {editingId === admin.id ? (
                  <div className="space-y-4">
                    <h3 className="font-bold text-[#0f2460]">تعديل بيانات المسؤول</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                      />
                      <input
                        type="text"
                        placeholder="الاسم"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                      />
                      <select
                        value={editForm.role || 'admin'}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value as any})}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                      >
                        <option value="super_admin">مدير عام</option>
                        <option value="admin">مدير</option>
                        <option value="manager">مدير حساب</option>
                      </select>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateAdmin}
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        حفظ
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
                          setNewPassword('');
                        }}
                        className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition flex items-center justify-center gap-2"
                      >
                        <X size={16} />
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-[#0f2460]">{admin.name}</h4>
                      <p className="text-sm text-slate-600">{admin.email}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        الدور: <span className="font-semibold">{admin.role}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(admin.id, admin.is_active)}
                        className={`px-3 py-2 rounded-lg transition text-sm font-semibold ${
                          admin.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {admin.is_active ? 'نشط' : 'معطل'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(admin.id);
                          setEditForm(admin);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">تغيير كلمة المرور الخاصة بك</p>
              <p>تأكد من استخدام كلمة مرور قوية وحفظها في مكان آمن</p>
            </div>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="كلمة المرور الحالية"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
            />
            <input
              type="password"
              placeholder="كلمة المرور الجديدة"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
            />
            <input
              type="password"
              placeholder="تأكيد كلمة المرور الجديدة"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
            />
            <button className="w-full bg-[#0f2460] text-white px-4 py-3 rounded-lg hover:bg-[#0f2460]/90 transition font-semibold flex items-center justify-center gap-2">
              <Save size={18} />
              تحديث كلمة المرور
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-[#0f2460] text-lg mb-4">إعدادات الأمان</h3>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-[#0f2460] mb-2">المصادقة الثنائية</h4>
              <p className="text-sm text-slate-600 mb-3">تفعيل المصادقة الثنائية لحماية حسابك</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                تفعيل المصادقة الثنائية
              </button>
            </div>

            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold text-[#0f2460] mb-2">جلسات نشطة</h4>
              <p className="text-sm text-slate-600 mb-3">إدارة جلسات تسجيل الدخول النشطة</p>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                عرض الجلسات
              </button>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-semibold text-[#0f2460] mb-2">سجل الأنشطة الأمنية</h4>
              <p className="text-sm text-slate-600 mb-3">عرض جميع محاولات الدخول وتغييرات الأمان</p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                عرض السجل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
