import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Users, TrendingUp, DollarSign, Clock, CheckCircle,
  RefreshCw, AlertTriangle, Lock, Star, Activity, Package,
  BarChart2, FileJson, ChevronRight, Edit, Trash2, Plus, X, Save
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  getOrders, getSupervisors, getProducts,
  checkAndAutoLockSupervisors, getLastScraperImport,
  type ScraperImportRecord,
} from '@/lib/storage';
import { formatCurrency, formatDate, hoursSince } from '@/lib/utils';
import { MOCK_ANALYTICS } from '@/constants/data';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────────────────────
// Direct Supabase Client (Self-contained, no external dependencies)
// ──────────────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ──────────────────────────────────────────────────────────────
// Types for Database Tables
// ──────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name_en?: string;
  name_ar?: string;
  price?: number;
  stock?: number;
  category_en?: string;
  category_ar?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

interface Order {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  status?: string;
  total_amount?: number;
  [key: string]: unknown;
}

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
}

interface TableData {
  [key: string]: unknown[];
}

// ──────────────────────────────────────────────────────────────
// Modal Component for CRUD Operations
// ──────────────────────────────────────────────────────────────
interface EditModalProps {
  isOpen: boolean;
  title: string;
  fields: { key: string; label: string; type: string }[];
  data: Record<string, any>;
  onSave: (updated: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

function EditModal({ isOpen, title, fields, data, onSave, onClose }: EditModalProps) {
  const [formData, setFormData] = useState(data);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(data);
  }, [data, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0f2460]">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4ff]"
                  rows={3}
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4ff]"
                >
                  <option value="">{`Select ${field.label}`}</option>
                  {field.key === 'status' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </>
                  )}
                </select>
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  value={formData[field.key] || ''}
                  onChange={e => setFormData({ ...formData, [field.key]: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4ff]"
                />
              ) : (
                <input
                  type="text"
                  value={formData[field.key] || ''}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4ff]"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[#0f2460] text-white rounded-lg hover:bg-[#0f2460]/90 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Data Table Component
// ──────────────────────────────────────────────────────────────
interface DataTableProps {
  tableName: string;
  columns: { key: string; label: string; type?: string }[];
  data: unknown[];
  onEdit: (row: unknown) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

function DataTable({ tableName, columns, data, onEdit, onDelete, loading }: DataTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-[#0f2460] border-t-[#00d4ff] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <p className="text-sm">لا توجد بيانات متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-start text-xs font-semibold text-slate-500">
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.slice(0, 10).map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-slate-50">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-slate-600 max-w-xs truncate">
                  {typeof row[col.key] === 'object' ? JSON.stringify(row[col.key]).slice(0, 50) : String(row[col.key] || '—')}
                </td>
              ))}
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(row)}
                    className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                    title="تعديل"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(row.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <div className="text-center py-3 text-xs text-slate-400 border-t border-slate-50">
          عرض 10 من {data.length} سجل
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Admin Dashboard Component
// ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { t, lang, settings } = useApp();
  const navigate = useNavigate();

  // Legacy data
  const [orders, setOrders] = useState(getOrders());
  const [supervisors, setSupervisors] = useState(getSupervisors());
  const [products] = useState(getProducts());
  const [lastSync, setLastSync] = useState<ScraperImportRecord | null>(null);

  // CRUD System state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'wallets' | 'installments'>('dashboard');
  const [tableData, setTableData] = useState<TableData>({
    products: [],
    orders: [],
    user_profiles: [],
    wallets: [],
    installments: [],
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    products: false,
    orders: false,
    user_profiles: false,
    wallets: false,
    installments: false,
  });
  const [editingRow, setEditingRow] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTableName, setSelectedTableName] = useState<string>('');

  useEffect(() => {
    checkAndAutoLockSupervisors();
    setSupervisors(getSupervisors());
    setLastSync(getLastScraperImport());
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Fetch Products with Pagination (Handle 4500+ records)
  // ──────────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const allProducts: Product[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error('Error fetching products:', error);
          toast.error(`خطأ في تحميل المنتجات: ${error.message}`);
          break;
        }

        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allProducts.push(...data);
          offset += pageSize;
          if (data.length < pageSize) {
            hasMore = false;
          }
        }
      }

      setTableData(prev => ({ ...prev, products: allProducts }));
      toast.success(`تم تحميل ${allProducts.length} منتج بنجاح`);
    } catch (err) {
      console.error('Unexpected error fetching products:', err);
      toast.error('خطأ غير متوقع في تحميل المنتجات');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Fetch Orders with Pagination (Fixed: Handle All Orders)
  // ──────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const allOrders: Order[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .range(offset, offset + pageSize - 1)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          toast.error(`خطأ في تحميل الطلبات: ${error.message}`);
          break;
        }

        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allOrders.push(...data);
          offset += pageSize;
          if (data.length < pageSize) {
            hasMore = false;
          }
        }
      }

      setTableData(prev => ({ ...prev, orders: allOrders }));
      toast.success(`تم تحميل ${allOrders.length} طلب بنجاح`);
    } catch (err) {
      console.error('Unexpected error fetching orders:', err);
      toast.error('خطأ غير متوقع في تحميل الطلبات');
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Fetch User Profiles
  // ──────────────────────────────────────────────────────────────
  const fetchUserProfiles = async () => {
    setLoading(prev => ({ ...prev, user_profiles: true }));
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(100);

      if (error) {
        console.error('Error fetching user profiles:', error);
        toast.error(`خطأ في تحميل المستخدمين: ${error.message}`);
        return;
      }

      setTableData(prev => ({ ...prev, user_profiles: data || [] }));
    } catch (err) {
      console.error('Unexpected error fetching user profiles:', err);
      toast.error('خطأ غير متوقع في تحميل المستخدمين');
    } finally {
      setLoading(prev => ({ ...prev, user_profiles: false }));
    }
  };

  // --------------------------------------------------------------
  // Fetch Wallets
  // --------------------------------------------------------------
  const fetchWallets = async () => {
    setLoading(prev => ({ ...prev, wallets: true }));
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .limit(100);

      if (error) {
        console.error('Error fetching wallets:', error);
        toast.error(`خطأ في تحميل المحافظ: ${error.message}`);
        return;
      }

      setTableData(prev => ({ ...prev, wallets: data || [] }));
    } catch (err) {
      console.error('Unexpected error fetching wallets:', err);
      toast.error('خطأ غير متوقع في تحميل المحافظ');
    } finally {
      setLoading(prev => ({ ...prev, wallets: false }));
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Fetch Installments
  // ──────────────────────────────────────────────────────────────
  const fetchInstallments = async () => {
    setLoading(prev => ({ ...prev, installments: true }));
    try {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .limit(100);

      if (error) {
        console.error('Error fetching installments:', error);
        toast.error(`خطأ في تحميل الأقساط: ${error.message}`);
        return;
      }

      setTableData(prev => ({ ...prev, installments: data || [] }));
    } catch (err) {
      console.error('Unexpected error fetching installments:', err);
      toast.error('خطأ غير متوقع في تحميل الأقساط');
    } finally {
      setLoading(prev => ({ ...prev, installments: false }));
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Handle Tab Change
  // ──────────────────────────────────────────────────────────────
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'products' && tableData.products.length === 0) fetchProducts();
    if (tab === 'orders' && tableData.orders.length === 0) fetchOrders();
    if (tab === 'users' && tableData.user_profiles.length === 0) fetchUserProfiles();
    if (tab === 'wallets' && tableData.wallets.length === 0) fetchWallets();
    if (tab === 'installments' && tableData.installments.length === 0) fetchInstallments();
  };

  // ──────────────────────────────────────────────────────────────
  // Handle Edit
  // ──────────────────────────────────────────────────────────────
  const handleEdit = (row: unknown, tableName: string) => {
    setEditingRow(row);
    setSelectedTableName(tableName);
    setIsModalOpen(true);
  };

  // --------------------------------------------------------------
  // Handle Save
  // --------------------------------------------------------------
  const handleSave = async (updated: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from(selectedTableName)
        .update(updated)
        .eq('id', editingRow.id);

      if (error) {
        toast.error(`خطأ في التحديث: ${error.message}`);
        return;
      }

      toast.success('تم التحديث بنجاح');

      // Update local state
      setTableData(prev => ({
        ...prev,
        [selectedTableName]: prev[selectedTableName].map(row =>
          row.id === editingRow.id ? { ...row, ...updated } : row
        ),
      }));
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('خطأ غير متوقع');
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Handle Delete
  // ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const { error } = await supabase
        .from(selectedTableName)
        .delete()
        .eq('id', id);

      if (error) {
        toast.error(`خطأ في الحذف: ${error.message}`);
        return;
      }

      toast.success('تم الحذف بنجاح');

      setTableData(prev => ({
        ...prev,
        [selectedTableName]: prev[selectedTableName].filter(row => row.id !== id),
      }));
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error('خطأ غير متوقع');
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Legacy Dashboard Stats (Keep for compatibility)
  // ──────────────────────────────────────────────────────────────
  const stats = {
    total: orders.length,
    pending: orders.filter(o => ['pending', 'under-inquiry', 'admin-review'].includes(o.status)).length,
    adminReview: orders.filter(o => o.status === 'admin-review').length,
    approved: orders.filter(o => ['approved', 'delivered'].includes(o.status)).length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    revenue: orders.filter(o => ['approved', 'delivered'].includes(o.status)).reduce((s, o) => s + o.installmentPlan.totalAmount, 0),
    lockedSupervisors: supervisors.filter(s => s.isLocked).length,
    pendingDebt: supervisors.reduce((s, sup) => s + (sup.pendingDebt ?? 0), 0),
  };

  // ──────────────────────────────────────────────────────────────
  // Column Definitions for Each Table
  // ──────────────────────────────────────────────────────────────
  const tableColumns: Record<string, { key: string; label: string; type?: string }[]> = {
    products: [
      { key: 'id', label: 'ID' },
      { key: 'name_en', label: 'Product Name (EN)' },
      { key: 'name_ar', label: 'Product Name (AR)' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'stock', label: 'Stock', type: 'number' },
      { key: 'category_en', label: 'Category' },
      { key: 'is_active', label: 'Active' },
    ],
    orders: [
      { key: 'id', label: 'Order ID' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'customer_phone', label: 'Phone' },
      { key: 'status', label: 'Status', type: 'select' },
      { key: 'total_amount', label: 'Amount', type: 'number' },
    ],
    user_profiles: [
      { key: 'id', label: 'User ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role', type: 'select' },
    ],
    wallets: [
      { key: 'id', label: 'Wallet ID' },
      { key: 'user_id', label: 'User ID' },
      { key: 'balance', label: 'Balance', type: 'number' },
      { key: 'status', label: 'Status', type: 'select' },
    ],
    installments: [
      { key: 'id', label: 'Installment ID' },
      { key: 'order_id', label: 'Order ID' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'status', label: 'Status', type: 'select' },
      { key: 'due_date', label: 'Due Date' },
    ],
  };

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم' },
    { id: 'products', label: 'المنتجات', icon: '📦' },
    { id: 'orders', label: 'الطلبات', icon: '🛒' },
    { id: 'users', label: 'المستخدمون', icon: '👥' },
    { id: 'wallets', label: 'المحافظ', icon: '💰' },
    { id: 'installments', label: 'الأقساط', icon: '📅' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Tab Navigation ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-0 overflow-x-auto p-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as typeof activeTab)}
              className={`px-5 py-4 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#00d4ff] text-[#0f2460]'
                  : 'border-transparent text-slate-600 hover:text-[#0f2460]'
              }`}
            >
              {tab.icon && <span className="me-2">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dashboard Content ── */}
      {activeTab === 'dashboard' && (
        <>
          {/* ── Alert: Locked Supervisors ── */}
          {stats.lockedSupervisors > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <Lock size={18} className="text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">
                  {stats.lockedSupervisors} {t('حساب مشرف مقفل بسبب تأخر تسليم العهدة', 'supervisor account(s) locked — delayed custody settlement')}
                </p>
                <button onClick={() => navigate('/admin/wallets')} className="text-red-600 text-xs underline mt-0.5">
                  {t('إدارة المحافظ والعهد', 'Manage Wallets & Custody')}
                </button>
              </div>
            </div>
          )}

          {/* ── Alert: Admin Review ── */}
          {stats.adminReview > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-purple-600" />
                <span className="text-purple-800 text-sm font-semibold">
                  {stats.adminReview} {t('طلبات جاهزة لقرارك النهائي', 'orders ready for your final decision')}
                </span>
              </div>
              <button onClick={() => navigate('/admin/orders')} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
                {t('مراجعة الآن', 'Review Now')}
              </button>
            </div>
          )}

          {/* ── Sync Status Bar ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${lastSync ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <FileJson size={18} className={lastSync ? 'text-green-600' : 'text-slate-400'} />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 text-sm">
                    {t('مزامنة منتجات BTech', 'BTech Products Sync')}
                  </p>
                  {lastSync ? (
                    <p className="text-slate-500 text-xs">
                      {t('آخر استيراد:', 'Last import:')} {new Date(lastSync.importedAt).toLocaleString(lang === 'ar' ? 'ar-EG' : undefined)}
                      {' · '}
                      <span className="text-green-600 font-medium">+{lastSync.added}</span> {t('جديد', 'new')}
                      {' · '}
                      <span className="text-blue-500 font-medium">{lastSync.updated}</span> {t('محدَّث', 'updated')}
                    </p>
                  ) : (
                    <p className="text-slate-400 text-xs">{t('لم يتم الاستيراد بعد', 'No import done yet')}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/products')}
                className="btn-outline text-sm flex items-center gap-2 flex-shrink-0"
              >
                <RefreshCw size={15} />
                {t('استيراد منتجات', 'Import Products')}
              </button>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'إجمالي الطلبات', value: stats.total, icon: ShoppingBag, color: 'bg-blue-500' },
              { label: 'بانتظار المراجعة', value: stats.adminReview, icon: Clock, color: 'bg-purple-500' },
              { label: 'معتمدة', value: stats.approved, icon: CheckCircle, color: 'bg-green-500' },
              { label: 'الإيرادات', value: formatCurrency(stats.revenue, lang), icon: DollarSign, color: 'bg-[#d4a339]' },
              { label: 'المشرفون النشطون', value: supervisors.filter(s => s.isActive && !s.isLocked).length, icon: Users, color: 'bg-[#0f2460]' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center text-white`}>
                      <Icon size={22} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#0f2460]">{s.value}</div>
                  <div className="text-slate-500 text-sm">{s.label}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Products Tab ── */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f2460]">إدارة المنتجات</h3>
            <button
              onClick={fetchProducts}
              className="text-sm bg-[#0f2460] text-white px-4 py-2 rounded-lg hover:bg-[#0f2460]/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              تحديث
            </button>
          </div>
          <div className="p-5">
            <DataTable
              tableName="products"
              columns={tableColumns.products}
              data={tableData.products}
              onEdit={(row) => handleEdit(row, 'products')}
              onDelete={(id) => {
                setSelectedTableName('products');
                handleDelete(id);
              }}
              loading={loading.products}
            />
          </div>
        </div>
      )}

      {/* ── Orders Tab ── */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f2460]">إدارة الطلبات</h3>
            <button
              onClick={fetchOrders}
              className="text-sm bg-[#0f2460] text-white px-4 py-2 rounded-lg hover:bg-[#0f2460]/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              تحديث
            </button>
          </div>
          <div className="p-5">
            <DataTable
              tableName="orders"
              columns={tableColumns.orders}
              data={tableData.orders}
              onEdit={(row) => handleEdit(row, 'orders')}
              onDelete={(id) => {
                setSelectedTableName('orders');
                handleDelete(id);
              }}
              loading={loading.orders}
            />
          </div>
        </div>
      )}

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f2460]">إدارة المستخدمين</h3>
            <button
              onClick={fetchUserProfiles}
              className="text-sm bg-[#0f2460] text-white px-4 py-2 rounded-lg hover:bg-[#0f2460]/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              تحديث
            </button>
          </div>
          <div className="p-5">
            <DataTable
              tableName="user_profiles"
              columns={tableColumns.user_profiles}
              data={tableData.user_profiles}
              onEdit={(row) => handleEdit(row, 'user_profiles')}
              onDelete={(id) => {
                setSelectedTableName('user_profiles');
                handleDelete(id);
              }}
              loading={loading.user_profiles}
            />
          </div>
        </div>
      )}

      {/* ── Wallets Tab ── */}
      {activeTab === 'wallets' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f2460]">إدارة المحافظ</h3>
            <button
              onClick={fetchWallets}
              className="text-sm bg-[#0f2460] text-white px-4 py-2 rounded-lg hover:bg-[#0f2460]/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              تحديث
            </button>
          </div>
          <div className="p-5">
            <DataTable
              tableName="wallets"
              columns={tableColumns.wallets}
              data={tableData.wallets}
              onEdit={(row) => handleEdit(row, 'wallets')}
              onDelete={(id) => {
                setSelectedTableName('wallets');
                handleDelete(id);
              }}
              loading={loading.wallets}
            />
          </div>
        </div>
      )}

      {/* ── Installments Tab ── */}
      {activeTab === 'installments' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f2460]">إدارة الأقساط</h3>
            <button
              onClick={fetchInstallments}
              className="text-sm bg-[#0f2460] text-white px-4 py-2 rounded-lg hover:bg-[#0f2460]/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              تحديث
            </button>
          </div>
          <div className="p-5">
            <DataTable
              tableName="installments"
              columns={tableColumns.installments}
              data={tableData.installments}
              onEdit={(row) => handleEdit(row, 'installments')}
              onDelete={(id) => {
                setSelectedTableName('installments');
                handleDelete(id);
              }}
              loading={loading.installments}
            />
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingRow && (
        <EditModal
          isOpen={isModalOpen}
          title={`تعديل ${editingRow.id}`}
          fields={tableColumns[selectedTableName] || []}
          data={editingRow}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRow(null);
          }}
        />
      )}
    </div>
  );
}
