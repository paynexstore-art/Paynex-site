import { useState, useEffect } from 'react';
import { Search, Eye, RefreshCw, AlertCircle, Check, X, Truck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchOrdersWithDetails, type OrderWithDetails } from '@/lib/supabaseAdmin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logAuditEntry } from '@/lib/supabaseSync';
import { toast } from 'sonner';

const ORDER_STATUSES = [
  { value: 'all', labelAr: 'الكل', labelEn: 'All' },
  { value: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending' },
  { value: 'under-inquiry', labelAr: 'جاري الاستعلام', labelEn: 'Under Inquiry' },
  { value: 'admin-review', labelAr: 'مراجعة المدير', labelEn: 'Admin Review' },
  { value: 'approved', labelAr: 'موافقة نهائية', labelEn: 'Approved' },
  { value: 'delivered', labelAr: 'تم التسليم', labelEn: 'Delivered' },
  { value: 'rejected', labelAr: 'مرفوض', labelEn: 'Rejected' },
];

export default function AdminOrders() {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<OrderWithDetails | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrdersWithDetails();
      setOrders(data);
      console.log('[v0] Orders loaded from Supabase:', data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(t('فشل في تحميل الطلبات', 'Failed to load orders'));
      console.error('[v0] Load orders error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleOrderAction(order: OrderWithDetails, action: 'approve' | 'reject' | 'deliver') {
    if (!user) return;
    
    setActionLoading(order.id);
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Update order status in database
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: action === 'deliver' ? 'delivered' : action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      // Log audit entry
      await logAuditEntry(
        `ORDER_${action.toUpperCase()}`,
        'ORDER',
        order.id,
        user.id,
        user.name || 'Admin',
        { status: order.status },
        { status: action === 'deliver' ? 'delivered' : action === 'approve' ? 'approved' : 'rejected' }
      );

      // Reload orders
      await loadOrders();
      
      const statusText = action === 'deliver' ? t('تم التسليم', 'Delivered') : 
                        action === 'approve' ? t('موافقة', 'Approved') : 
                        t('مرفوض', 'Rejected');
      toast.success(t(`تم ${statusText}`, `Order ${statusText}`));
    } catch (err) {
      console.error('[v0] Order action error:', err);
      toast.error(t('فشل تحديث الطلب', 'Failed to update order'));
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-900 text-sm font-medium">{error}</p>
            <button onClick={loadOrders} className="text-red-700 hover:underline text-xs mt-1">
              {t('حاول مرة أخرى', 'Try again')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0f2460]">{t('الطلبات', 'Orders')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {t(`إجمالي: ${orders.length} طلب`, `Total: ${orders.length} orders`)}
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
          title={t('تحديث', 'Refresh')}
        >
          <RefreshCw size={18} className="text-[#0f2460]" />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t('ابحث عن طلب...', 'Search orders...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2460]/20 text-sm"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {lang === 'ar' ? s.labelAr : s.labelEn}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <p className="text-slate-400">{t('لا توجد طلبات', 'No orders')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">
                    {t('رقم الطلب', 'Order ID')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">
                    {t('العميل', 'Customer')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">
                    {t('المبلغ', 'Amount')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">
                    {t('الحالة', 'Status')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">
                    {t('التاريخ', 'Date')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600">
                    {t('إجراء', 'Action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm font-mono text-[#0f2460]">{order.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0f2460]">{order.customer_name || 'عميل باينكس'}</p>
                        <p className="text-xs text-slate-500">{order.customer_phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#d4a339]">
                      {formatCurrency(order.total_amount || 0, lang)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                          order.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : order.status === 'delivered'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(order.created_at, lang)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {order.status !== 'approved' && order.status !== 'rejected' && (
                          <button
                            onClick={() => handleOrderAction(order, 'approve')}
                            disabled={actionLoading === order.id}
                            className="p-2 rounded hover:bg-green-100 transition disabled:opacity-50"
                            title={t('موافقة', 'Approve')}
                          >
                            <Check size={16} className="text-green-600" />
                          </button>
                        )}
                        {order.status !== 'rejected' && (
                          <button
                            onClick={() => handleOrderAction(order, 'reject')}
                            disabled={actionLoading === order.id}
                            className="p-2 rounded hover:bg-red-100 transition disabled:opacity-50"
                            title={t('رفض', 'Reject')}
                          >
                            <X size={16} className="text-red-600" />
                          </button>
                        )}
                        {order.status === 'approved' && order.status !== 'delivered' && (
                          <button
                            onClick={() => handleOrderAction(order, 'deliver')}
                            disabled={actionLoading === order.id}
                            className="p-2 rounded hover:bg-blue-100 transition disabled:opacity-50"
                            title={t('تسليم', 'Deliver')}
                          >
                            <Truck size={16} className="text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelected(order)}
                          className="p-2 rounded hover:bg-slate-200 transition"
                          title={t('عرض', 'View')}
                        >
                          <Eye size={16} className="text-[#0f2460]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
