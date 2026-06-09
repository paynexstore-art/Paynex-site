import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, CheckCircle, XCircle, FileText, AlertCircle, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, getOrdersByCustomer } from '@/lib/storage';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor, isVerifyingStatus } from '@/lib/utils';
import type { Order } from '@/types';

/** Pulsing yellow-orange badge for "جاري التحقق من الطلب" */
function VerifyingBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 verifying-pulse">
      <span className="w-2 h-2 rounded-full bg-amber-400 pulse-dot" />
      {label}
    </span>
  );
}

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const { t, lang } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (orderId) {
      const order = getOrders().find(o => o.id === orderId);
      if (order) { setSelected(order); setOrders([order]); }
    } else {
      const userOrders = getOrdersByCustomer(user.id);
      setOrders(userOrders);
      if (userOrders.length > 0) setSelected(userOrders[0]);
    }
  }, [orderId, user, navigate]);

  function renderStatusBanner(order: Order) {
    const { status } = order;
    if (isVerifyingStatus(status)) {
      return (
        <div className="rounded-xl p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-amber-500" />
            </span>
            <div>
              <p className="font-bold text-amber-800 text-base">
                {t('جاري التحقق من الطلب', 'Verifying Your Order')}
              </p>
              <p className="text-amber-600 text-sm mt-0.5">
                {t('طلبك قيد المراجعة الميدانية — سيتم التواصل معك خلال 24-48 ساعة', 'Your order is under field review — you will be contacted within 24-48 hours')}
              </p>
            </div>
          </div>
          {/* Pulsing progress bar */}
          <div className="mt-3 h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full w-2/3 verifying-progress" />
          </div>
        </div>
      );
    }
    if (status === 'rejected') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">
                {t('لم تكتمل الموافقة على طلبك', 'Your Order Was Not Approved')}
              </p>
              <p className="text-red-600 text-sm mt-1">
                {t('شكراً لتقديمك، يمكنك التواصل مع خدمة العملاء للمزيد من التفاصيل.', 'Thank you for applying. Please contact customer support for more details.')}
              </p>
              {order.canReapplyAt && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {t(`إعادة التقديم بعد: ${formatDate(order.canReapplyAt, 'ar')}`, `Reapply after: ${formatDate(order.canReapplyAt, 'en')}`)}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    if (status === 'approved') {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
            <p className="font-semibold text-emerald-800">
              {t('تهانينا! تمت الموافقة على طلبك — سيتواصل معك المشرف قريباً', 'Congratulations! Order Approved — Supervisor will contact you soon')}
            </p>
          </div>
        </div>
      );
    }
    if (status === 'delivered' || status === 'active') {
      return (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-teal-500 flex-shrink-0" />
            <p className="font-semibold text-teal-800">
              {t('تم التسليم وتفعيل خطة الأقساط — شكراً لثقتك في باينكس', 'Delivered! Installment plan is now active — Thank you for choosing PayNex')}
            </p>
          </div>
        </div>
      );
    }
    if (status === 'pending') {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-slate-400 flex-shrink-0" />
            <p className="font-semibold text-slate-600">
              {t('تم استلام طلبك — سيتم تعيين مشرف محلي قريباً', 'Order received — A local supervisor will be assigned soon')}
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="section-title mb-2">{t('متابعة طلباتي', 'My Orders')}</h1>
        <p className="text-slate-500 text-sm mb-6">{t('تتبع حالة طلبك بشكل مباشر', 'Track your order status in real time')}</p>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={60} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">{t('لا توجد طلبات بعد', 'No orders yet')}</h3>
            <button onClick={() => navigate('/products')} className="btn-primary mt-4">
              {t('تسوق الآن', 'Shop Now')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="md:col-span-1 space-y-3">
              {orders.map(o => (
                <button key={o.id} onClick={() => setSelected(o)}
                  className={`w-full text-start p-4 rounded-xl border-2 transition-all ${
                    selected?.id === o.id ? 'border-[#0a1628] bg-white shadow-lg' : 'border-slate-100 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {o.status === 'approved' || o.status === 'delivered'
                      ? <CheckCircle className="text-emerald-500 flex-shrink-0" size={18} />
                      : o.status === 'rejected'
                        ? <XCircle className="text-red-400 flex-shrink-0" size={18} />
                        : <Clock className={`flex-shrink-0 ${isVerifyingStatus(o.status) ? 'text-amber-500' : 'text-slate-400'}`} size={18} />
                    }
                    <span className="font-semibold text-sm text-[#0a1628] truncate">
                      {lang === 'ar' ? o.product.nameAr : o.product.nameEn}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-1">{formatDate(o.createdAt, lang)}</div>
                  {isVerifyingStatus(o.status)
                    ? <VerifyingBadge label={getOrderStatusLabel(o.status, lang)} />
                    : <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status, lang)}</span>
                  }
                </button>
              ))}
            </div>

            {/* Order Details */}
            {selected && (
              <div className="md:col-span-2 bg-white rounded-2xl shadow-md border border-slate-100 p-6 animate-fade-in">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-black text-xl text-[#0a1628]">
                      {lang === 'ar' ? selected.product.nameAr : selected.product.nameEn}
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">{t('رقم الطلب:', 'Order #:')} <span className="font-mono">{selected.id}</span></p>
                  </div>
                  {isVerifyingStatus(selected.status)
                    ? <VerifyingBadge label={getOrderStatusLabel(selected.status, lang)} />
                    : <span className={`text-sm px-3 py-1 rounded-full font-semibold ${getOrderStatusColor(selected.status)}`}>
                        {getOrderStatusLabel(selected.status, lang)}
                      </span>
                  }
                </div>

                {/* Status Banner */}
                {renderStatusBanner(selected)}

                {/* Inquiry Fee Notice */}
                <div className="bg-[#0a1628]/5 border border-[#0a1628]/10 rounded-xl p-3 mb-4 text-xs text-[#0a1628] flex items-start gap-2">
                  <AlertCircle size={13} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                  {t(
                    'تطبق رسوم استعلام تدفع عند توقيع طلب التقسيط ورفع المستندات',
                    'Inquiry fees apply, payable when signing the installment agreement and submitting documents'
                  )}
                </div>

                {/* Plan Details */}
                <div className="bg-gradient-to-br from-[#0a1628] to-[#0e2044] rounded-xl p-4 mb-4">
                  <h3 className="text-[#00d4ff] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={13} />
                    {t('خطة التقسيط', 'Installment Plan')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t('القسط الشهري', 'Monthly'), value: formatCurrency(selected.installmentPlan.monthlyPayment, lang), highlight: true },
                      { label: t('المدة', 'Duration'), value: `${selected.installmentPlan.months} ${t('شهر', 'months')}` },
                      { label: t('المقدم', 'Down Payment'), value: formatCurrency(selected.installmentPlan.downPayment, lang) },
                      { label: t('الإجمالي', 'Total'), value: formatCurrency(selected.installmentPlan.totalAmount, lang) },
                      { label: t('رسوم الاستعلام', 'Inquiry Fee'), value: formatCurrency(selected.installmentPlan.inquiryFee, lang) },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="text-white/40 text-xs">{item.label}</div>
                        <div className={`font-bold ${item.highlight ? 'text-[#c9a84c] text-lg' : 'text-white'}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: t('الاسم', 'Name'), value: selected.customerName },
                    { label: t('الهاتف', 'Phone'), value: selected.customerPhone },
                    { label: t('المحافظة', 'Province'), value: selected.customerProvince },
                    { label: t('الوظيفة', 'Job'), value: selected.customerJob },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-xs text-slate-400">{item.label}</div>
                      <div className="font-medium text-slate-700">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
