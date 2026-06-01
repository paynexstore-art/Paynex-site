import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, User, Phone, MapPin, Package, Edit, Trash2, Eye, CheckCircle, Clock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getOrders, type Order } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface OrderWithDetails extends Order {
  customer_email?: string;
  customer_address?: string;
  customer_city?: string;
  products_details?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface OrderActionModalProps {
  isOpen: boolean;
  order: OrderWithDetails | null;
  onClose: () => void;
  onSave: (updated: Partial<OrderWithDetails>) => Promise<void>;
}

function OrderActionModal({ isOpen, order, onClose, onSave }: OrderActionModalProps) {
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status || 'pending');
      setNotes(order.notes || '');
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({ status, notes });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-[#0f2460] mb-4">📋 إدارة الطلب #{order.id}</h2>
        
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="text-sm text-slate-600">العميل</p>
            <p className="font-semibold text-slate-900">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">البريد الإلكتروني</p>
            <p className="font-semibold text-slate-900">{order.customer_email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">الهاتف</p>
            <p className="font-semibold text-slate-900">{order.customer_phone}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">العنوان</p>
            <p className="font-semibold text-slate-900">{order.customer_address || 'N/A'}</p>
          </div>
        </div>

        {/* Products */}
        <div className="mb-6">
          <h3 className="font-bold text-slate-900 mb-3">المنتجات</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {order.products_details?.map((product, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="font-medium">{product.name}</span>
                <span className="text-sm text-slate-600">×{product.quantity}</span>
                <span className="font-semibold">{formatCurrency(product.price, 'ar')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Notes */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">الحالة</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4ff]"
            >
              <option value="pending">قيد الانتظار</option>
              <option value="admin-review">قيد مراجعة الإدارة</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
              <option value="processing">قيد المعالجة</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">تم التسليم</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4ff]"
              rows={3}
              placeholder="أضف ملاحظات أو تعليقات..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
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
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersManagement() {
  const { t, lang } = useApp();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const legacyOrders = getOrders();
      
      // Fetch from Supabase with full details
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id(email, address, city),
          order_items(id, product_id, quantity, price)
        `)
        .limit(100);

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('خطأ في تحميل الطلبات');
        setOrders(legacyOrders);
        return;
      }

      const enriched = (data || legacyOrders).map((order: any) => ({
        ...order,
        customer_email: order.customer?.email,
        customer_address: order.customer?.address,
        customer_city: order.customer?.city,
        products_details: order.order_items || []
      }));

      setOrders(enriched);
      toast.success(`تم تحميل ${enriched.length} طلب`);
    } catch (err) {
      console.error('Error:', err);
      toast.error('خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async (updated: Partial<OrderWithDetails>) => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update(updated)
        .eq('id', selectedOrder.id);

      if (error) {
        toast.error(`خطأ: ${error.message}`);
        return;
      }

      toast.success('تم تحديث الطلب بنجاح ✓');
      setOrders(prev =>
        prev.map(o => (o.id === selectedOrder.id ? { ...o, ...updated } : o))
      );
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('خطأ غير متوقع');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        toast.error(`خطأ: ${error.message}`);
        return;
      }

      toast.success('تم حذف الطلب بنجاح ✓');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error('خطأ غير متوقع');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'processing':
        return <Clock className="text-blue-600" size={18} />;
      default:
        return <Package className="text-slate-600" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0f2460]">🛒 إدارة الطلبات</h1>
          <p className="text-slate-600 mt-1">إدارة كاملة لجميع طلبات العملاء مع بيانات شاملة</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="px-6 py-3 bg-[#0f2460] text-white rounded-lg hover:bg-[#0f2460]/90 transition-colors font-semibold disabled:opacity-50"
        >
          {loading ? 'جاري التحديث...' : '🔄 تحديث'}
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600">الطلب</th>
                <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600">العميل</th>
                <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600">الاتصال</th>
                <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600">المنتجات</th>
                <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600">الحالة</th>
                <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600">المبلغ</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p>لا توجد طلبات متاحة</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">#{order.id}</span>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(order.created_at || new Date().toISOString())}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-900">{order.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone size={14} />
                          {order.customer_phone}
                        </div>
                        {order.customer_email && (
                          <p className="text-slate-600 truncate">{order.customer_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {order.products_details?.slice(0, 2).map((p, i) => (
                          <p key={i} className="text-sm text-slate-700">
                            {p.name} ×{p.quantity}
                          </p>
                        ))}
                        {(order.products_details?.length || 0) > 2 && (
                          <p className="text-xs text-slate-500">+{(order.products_details?.length || 0) - 2} منتج آخر</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(order.total_amount || 0, lang)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <OrderActionModal
        isOpen={isModalOpen}
        order={selectedOrder}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onSave={handleSaveOrder}
      />
    </div>
  );
}
