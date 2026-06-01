/**
 * SupervisorOrders — reads orders for supervisor from Supabase (with localStorage fallback)
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Eye, DollarSign, Upload, FileCheck, Search, AlertCircle,
  CheckCircle, MapPin, X, Camera, Navigation, Loader2, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  getOrdersBySupervisor, updateOrder, addFeeToWallet, addNotification, getSupervisorById
} from '@/lib/storage';
import { fetchOrders } from '@/lib/db';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor, generateId } from '@/lib/utils';
import { getCurrentGps, addGpsWatermark } from '@/lib/geofencing';
import type { Order, OrderDocuments, GpsCoords } from '@/types';
import { toast } from 'sonner';

export default function SupervisorOrders() {
  const { user }      = useAuth();
  const { t, lang }   = useApp();
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<Order | null>(null);
  const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});
  const [confirmingFee, setConfirmingFee] = useState<string | null>(null);
  const [gps, setGps]                 = useState<GpsCoords | null>(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Try Supabase first, filter by supervisor
      const all = await fetchOrders();
      const mine = all.filter(o => o.supervisorId === user.id);
      // If nothing found via Supabase, fallback to localStorage
      if (mine.length === 0) {
        const local = getOrdersBySupervisor(user.id);
        setOrders(local);
      } else {
        setOrders(mine);
      }
    } catch {
      setOrders(getOrdersBySupervisor(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  async function fetchGps() {
    setFetchingGps(true);
    const coords = await getCurrentGps();
    setGps(coords);
    setFetchingGps(false);
    if (!coords) toast.warning(t('لم يتم الحصول على الموقع', 'GPS unavailable'));
    else toast.success(t('تم تحديد موقعك بنجاح', 'GPS acquired'));
  }

  function isFeeConfirmed(order: Order): boolean {
    return ['under-inquiry', 'admin-review', 'approved', 'delivered', 'under-review', 'active', 'completed']
      .includes(order.status) || (order.notes?.includes('fee_paid') ?? false);
  }

  async function handleConfirmFeeReceived(order: Order) {
    if (!user) return;
    const fee = order.installmentPlan.inquiryFee;
    addFeeToWallet(user.id, fee, order.id, order.customerName);
    updateOrder(order.id, {
      status: 'under-inquiry',
      inquiryFeePaidAt: new Date().toISOString(),
      notes: `fee_paid:${new Date().toISOString()}`,
    });
    addNotification({
      userId: order.customerId, type: 'order-update',
      titleAr: 'تم استلام رسوم الاستعلام',
      titleEn: 'Inquiry Fee Received',
      messageAr: 'تم استلام رسوم الاستعلام وطلبك الآن جاري الاستعلام الميداني.',
      messageEn: 'Inquiry fee received. Field visit in progress.',
      orderId: order.id,
    });
    toast.success(t(`تم إضافة ${formatCurrency(fee)} لمحفظتك`, `EGP ${fee} added to wallet`));
    setConfirmingFee(null);
    reload();
    setSelected(null);
  }

  async function handleDocUpload(field: keyof OrderDocuments, file: File, orderId: string) {
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const reader = new FileReader();
    reader.onload = async e => {
      let dataUrl = e.target?.result as string;
      const sup = user ? getSupervisorById(user.id) : null;
      if (gps) dataUrl = await addGpsWatermark(dataUrl, gps, sup?.name ?? user?.name ?? 'مشرف');

      setDocPreviews(prev => ({ ...prev, [field]: dataUrl }));
      const updatedDocs: OrderDocuments = {
        ...currentOrder.documents,
        [field]: dataUrl,
        uploadedAt: new Date().toISOString(),
        uploadedGps: gps ?? undefined,
      };

      const hasRequired = updatedDocs.nationalIdFront && updatedDocs.nationalIdBack;
      const newStatus = hasRequired ? 'admin-review' : currentOrder.status;

      updateOrder(orderId, { documents: updatedDocs, fieldVisitGps: gps ?? currentOrder.fieldVisitGps, status: newStatus });
      if (newStatus === 'admin-review' && currentOrder.status !== 'admin-review') {
        toast.success(t('اكتملت المستندات — تم إرسال الطلب لمراجعة المدير', 'Documents complete — escalated to Admin Review'));
      } else {
        toast.success(t('تم رفع المستند', 'Document uploaded'));
      }
      reload();
    };
    reader.readAsDataURL(file);
  }

  function handleEscalateToAdmin(orderId: string) {
    updateOrder(orderId, { status: 'admin-review' });
    toast.success(t('تم إرسال الطلب لمراجعة المدير', 'Escalated to Admin Review'));
    reload();
    setSelected(null);
  }

  const statuses = ['all', 'pending', 'under-inquiry', 'admin-review', 'approved', 'delivered', 'rejected'];
  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customerName.includes(search) || o.customerPhone.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const docFields: { key: keyof OrderDocuments; label: string }[] = [
    { key: 'nationalIdFront',    label: t('البطاقة - الوجه الأمامي *', 'ID Front *') },
    { key: 'nationalIdBack',     label: t('البطاقة - الوجه الخلفي *', 'ID Back *') },
    { key: 'utilityBill',        label: t('إيصال مرافق', 'Utility Bill') },
    { key: 'incomeProof',        label: t('إثبات دخل', 'Income Proof') },
    { key: 'customerHousePhoto', label: t('صورة منزل العميل', "House Photo") },
  ];

  return (
    <div className="space-y-4">
      {/* GPS Bar */}
      <div className="bg-[#0a1628]/5 border border-[#0a1628]/20 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#0a1628]">
          <Navigation size={16} className={gps ? 'text-emerald-500' : 'text-slate-400'} />
          {gps
            ? `${t('موقعك:', 'Location:')} ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`
            : t('الموقع الجغرافي غير محدد — مطلوب لرفع المستندات', 'GPS not set — required for uploads')}
        </div>
        <button onClick={fetchGps} disabled={fetchingGps} className="btn-outline text-xs px-3 py-2 flex items-center gap-1">
          {fetchingGps ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
          {fetchingGps ? t('جاري...', 'Getting...') : t('تحديد موقعي', 'Get GPS')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('بحث بالاسم أو الهاتف...', 'Search...')} className="input-field ps-9 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-auto">
          {statuses.map(s => (
            <option key={s} value={s}>{s === 'all' ? t('الكل', 'All') : getOrderStatusLabel(s, lang)}</option>
          ))}
        </select>
        <button onClick={reload} disabled={loading} className="btn-outline flex items-center gap-1 text-sm px-3">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
        {t('يجب تأكيد استلام رسوم الاستعلام أولاً لفتح صلاحية رفع المستندات. المبلغ يُضاف لمحفظتك فوراً.', 'Confirm inquiry fee first to unlock document upload. Amount added to wallet immediately.')}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-[#0a1628]" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {[t('العميل', 'Customer'), t('المنتج', 'Product'), t('القسط', 'Monthly'), t('الرسوم', 'Fee'), t('الدفع', 'Payment'), t('الحالة', 'Status'), ''].map(h => (
                    <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(o => {
                  const feePaid = isFeeConfirmed(o);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0a1628]">{o.customerName}</div>
                        <div className="text-xs text-slate-400">{o.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[130px]">
                        <div className="truncate">{o.product?.nameAr ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#0a1628]">
                        {o.installmentPlan ? formatCurrency(o.installmentPlan.monthlyPayment, lang) : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#c9a84c]">
                        {o.installmentPlan ? formatCurrency(o.installmentPlan.inquiryFee, lang) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {feePaid ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <CheckCircle size={13} /> {t('مدفوعة', 'Paid')}
                          </span>
                        ) : (
                          <button onClick={() => setConfirmingFee(o.id)}
                            className="text-xs bg-[#c9a84c] text-white px-3 py-1.5 rounded-lg hover:bg-[#b8913d] transition-colors flex items-center gap-1">
                            <DollarSign size={12} /> {t('تأكيد', 'Confirm')}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOrderStatusColor(o.status)}`}>
                          {getOrderStatusLabel(o.status, lang)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(o); setDocPreviews({}); }}
                          className="w-8 h-8 rounded-lg bg-[#0a1628]/10 hover:bg-[#0a1628] text-[#0a1628] hover:text-white flex items-center justify-center transition-all">
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">{t('لا توجد طلبات', 'No orders')}</div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Fee Modal */}
      {confirmingFee && (() => {
        const order = orders.find(o => o.id === confirmingFee);
        if (!order) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmingFee(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-[#c9a84c]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={32} className="text-[#c9a84c]" />
                </div>
                <h3 className="font-bold text-[#0a1628] text-lg mb-1">{t('تأكيد استلام رسوم الاستعلام', 'Confirm Fee Receipt')}</h3>
                <p className="text-slate-500 text-sm mb-1">{t('العميل:', 'Customer:')} <strong>{order.customerName}</strong></p>
                <p className="text-3xl font-black text-[#c9a84c] my-3">
                  {order.installmentPlan ? formatCurrency(order.installmentPlan.inquiryFee, lang) : '—'}
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-4 text-start space-y-1">
                  <p>✅ {t('يُضاف هذا المبلغ فوراً لمحفظتك كمديونية', 'Amount added to wallet as debt')}</p>
                  <p>✅ {t('يفتح لك صلاحية رفع مستندات العميل', 'Unlocks document upload')}</p>
                  <p>⚠️ {t('يجب تسليم العهدة للمدير يومياً', 'Must settle with admin daily')}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleConfirmFeeReceived(order)} className="btn-primary flex-1">
                    {t('تأكيد الاستلام', 'Confirm Receipt')}
                  </button>
                  <button onClick={() => setConfirmingFee(null)} className="btn-outline flex-1">
                    {t('إلغاء', 'Cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="font-bold text-[#0a1628]">{t('تفاصيل الطلب', 'Order Details')}</h3>
                <p className="text-xs text-slate-400">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: t('الاسم', 'Name'), v: selected.customerName },
                  { label: t('الهاتف', 'Phone'), v: selected.customerPhone },
                  { label: t('المحافظة', 'Province'), v: selected.customerProvince },
                  { label: t('الوظيفة', 'Job'), v: selected.customerJob },
                  { label: t('القسط الشهري', 'Monthly'), v: selected.installmentPlan ? formatCurrency(selected.installmentPlan.monthlyPayment, lang) : '—' },
                  { label: t('الرسوم', 'Fee'), v: selected.installmentPlan ? formatCurrency(selected.installmentPlan.inquiryFee, lang) : '—' },
                ].map(item => (
                  <div key={item.label}><p className="text-xs text-slate-400">{item.label}</p><p className="font-medium text-[#0a1628]">{item.v}</p></div>
                ))}
              </div>

              {/* Documents */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  {isFeeConfirmed(selected) ? <FileCheck size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                  <h4 className="font-semibold text-sm">{t('رفع المستندات', 'Upload Documents')}</h4>
                </div>

                {isFeeConfirmed(selected) ? (
                  <>
                    {!gps && (
                      <button onClick={fetchGps} disabled={fetchingGps}
                        className="w-full flex items-center justify-center gap-2 py-2 mb-3 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-[#0a1628] transition-colors">
                        <MapPin size={14} />
                        {fetchingGps ? t('جاري تحديد الموقع...', 'Getting GPS...') : t('تحديد الموقع الجغرافي (لإضافة watermark)', 'Get GPS for watermark')}
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {docFields.map(({ key, label }) => {
                        const existing = selected.documents[key as keyof typeof selected.documents] as string | undefined;
                        const preview  = docPreviews[key] ?? existing;
                        return (
                          <div key={key} className="border-2 border-dashed border-slate-200 rounded-xl p-3 hover:border-[#0a1628]/50 transition-colors">
                            <p className="text-xs text-slate-500 mb-2">{label}</p>
                            {preview ? (
                              <div className="relative">
                                <img src={preview} alt={label} className="w-full h-20 object-cover rounded-lg" />
                                <label className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg transition-opacity">
                                  <span className="text-white text-xs flex items-center gap-1"><Camera size={12} /> {t('تغيير', 'Change')}</span>
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={e => e.target.files?.[0] && handleDocUpload(key, e.target.files[0], selected.id)} />
                                </label>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-1 cursor-pointer py-3">
                                <Upload size={18} className="text-slate-400" />
                                <span className="text-xs text-slate-400">{t('رفع صورة', 'Upload')}</span>
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={e => e.target.files?.[0] && handleDocUpload(key, e.target.files[0], selected.id)} />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selected.status === 'under-inquiry' && (
                      <button onClick={() => handleEscalateToAdmin(selected.id)} className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm">
                        <CheckCircle size={15} />
                        {t('إرسال للمراجعة النهائية من المدير', 'Submit for Admin Review')}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-5 text-center">
                    <AlertCircle size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm mb-3">{t('مقفل — يفتح بعد تأكيد الرسوم', 'Locked — confirm fee first')}</p>
                    <button onClick={() => { setSelected(null); setConfirmingFee(selected.id); }} className="btn-primary text-sm px-4 py-2">
                      {t('تأكيد الرسوم', 'Confirm Fee')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
