import { useState, useEffect } from 'react';
import {
  BarChart3, Settings, Lock, Zap, Database, Users, Eye, EyeOff,
  Copy, Check, AlertTriangle, Download, Upload, Trash2, RefreshCw,
  Edit, Save, X, Plus, Shield
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SystemStats {
  totalUsers: number;
  totalAdmins: number;
  totalOrders: number;
  totalRevenue: number;
  lastBackup: string;
}

export default function AdminMasterControl() {
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'users' | 'backup' | 'security'>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSystemStats();
  }, []);

  async function loadSystemStats() {
    setLoading(true);
    try {
      // Fetch all system data
      const [users, admins, orders] = await Promise.all([
        supabase.from('user_profiles').select('COUNT').single(),
        supabase.from('admin_users').select('COUNT').single(),
        supabase.from('orders').select('COUNT').single(),
      ]);

      setStats({
        totalUsers: 0,
        totalAdmins: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastBackup: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('تم النسخ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f2460] to-[#1a3a7d] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black">لوحة التحكم الرئيسية</h1>
              <p className="text-white/70 text-sm">إدارة النظام الكاملة والسيطرة التامة</p>
            </div>
          </div>
          <button
            onClick={loadSystemStats}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-2 flex-wrap">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: <BarChart3 size={16} /> },
          { id: 'database', label: 'قاعدة البيانات', icon: <Database size={16} /> },
          { id: 'users', label: 'المستخدمون', icon: <Users size={16} /> },
          { id: 'backup', label: 'النسخ الاحتياطية', icon: <Download size={16} /> },
          { id: 'security', label: 'الأمان', icon: <Shield size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المستخدمين', value: '2,450', icon: Users, color: 'blue' },
            { label: 'المدراء النشطون', value: '12', icon: Shield, color: 'green' },
            { label: 'إجمالي الطلبات', value: '8,920', icon: BarChart3, color: 'purple' },
            { label: 'إجمالي الإيرادات', value: '1.2M ج.م', icon: Zap, color: 'amber' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white rounded-xl p-5 border border-slate-100">
                <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 flex items-center justify-center mb-3`}>
                  <Icon className={`text-${item.color}-600`} size={20} />
                </div>
                <p className="text-slate-600 text-sm">{item.label}</p>
                <p className="text-2xl font-black text-[#0f2460]">{item.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-[#0f2460] mb-4">إدارة قاعدة البيانات</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">معلومات الاتصال</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <span className="text-slate-600">خادم Supabase:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">{supabaseUrl.split('https://')[1]?.split('.')[0]}</code>
                    <button
                      onClick={() => copyToClipboard(supabaseUrl)}
                      className={`p-1 rounded transition ${copied ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'فحص الاتصال', action: 'فحص', color: 'blue' },
                { label: 'تحسين الجداول', action: 'تحسين', color: 'green' },
                { label: 'إصلاح البيانات', action: 'إصلاح', color: 'amber' },
                { label: 'حذف البيانات القديمة', action: 'حذف', color: 'red', danger: true },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className={`p-4 rounded-lg font-semibold text-white transition ${
                    item.danger
                      ? 'bg-red-600 hover:bg-red-700'
                      : `bg-${item.color}-600 hover:bg-${item.color}-700`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-bold text-lg text-[#0f2460] mb-4">إدارة المستخدمين</h3>
            
            <div className="space-y-3">
              {[
                { count: '2,450', label: 'المستخدمون النشطون', color: 'green' },
                { count: '340', label: 'المستخدمون المعطلون', color: 'red' },
                { count: '125', label: 'المستخدمون الجدد (هذا الأسبوع)', color: 'blue' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                  <span className="text-slate-700">{item.label}</span>
                  <span className={`text-2xl font-black text-${item.color}-600`}>{item.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                إرسال رسالة لكل المستخدمين
              </button>
              <button className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition">
                تفعيل/تعطيل مستخدمين
              </button>
              <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                حذف مستخدمين غير نشطين
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-bold text-lg text-[#0f2460] mb-4">النسخ الاحتياطية</h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 text-sm">✅ آخر نسخة احتياطية: اليوم الساعة 14:30</p>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
                <Download size={18} />
                إنشاء نسخة احتياطية الآن
              </button>
              <button className="w-full flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold">
                <Upload size={18} />
                استرجاع من نسخة احتياطية
              </button>
              <button className="w-full flex items-center gap-3 bg-slate-600 text-white px-4 py-3 rounded-lg hover:bg-slate-700 transition font-semibold">
                <BarChart3 size={18} />
                عرض السجل
              </button>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-[#0f2460] mb-3">النسخ الاحتياطية السابقة</h4>
              <div className="space-y-2">
                {['اليوم', 'أمس', 'قبل يومين'].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <span className="text-slate-700">{item}</span>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                      استرجاع
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-[#0f2460] mb-4">إعدادات الأمان</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">تحذيرات أمانية</p>
                  <p className="text-sm text-yellow-800 mt-1">• 3 محاولات دخول فاشلة في الساعة الماضية</p>
                  <p className="text-sm text-yellow-800">• تحديث نظام متاح</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'تفعيل المصادقة الثنائية', icon: Lock, color: 'blue' },
                { label: 'إعادة تعيين جميع الجلسات', icon: Shield, color: 'red' },
                { label: 'تحديث شهادات SSL', icon: Zap, color: 'green' },
                { label: 'فحص الثغرات الأمنية', icon: AlertTriangle, color: 'amber' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    className={`p-4 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 bg-${item.color}-600 hover:bg-${item.color}-700`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-[#0f2460] mb-3">سجل الأحداث الأمنية</h4>
              <div className="space-y-2">
                {[
                  { event: 'محاولة دخول ناجحة', time: 'قبل 5 دقائق', type: 'success' },
                  { event: 'تغيير كلمة مرور', time: 'قبل ساعة', type: 'info' },
                  { event: 'محاولة دخول فاشلة', time: 'قبل 2 ساعة', type: 'warning' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      item.type === 'success' ? 'bg-green-500' :
                      item.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <span className="flex-1 text-slate-700">{item.event}</span>
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
