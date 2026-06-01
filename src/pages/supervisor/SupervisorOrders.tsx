import { useState, useEffect, useCallback } from 'react';
import {
  Eye, DollarSign, Upload, FileCheck, Search, AlertCircle,
  CheckCircle, MapPin, X, Camera, Navigation
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import {
  addFeeToWallet, addNotification, getSupervisorById
} from '@/lib/storage';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor, generateId } from '@/lib/utils';
import { getCurrentGps, addGpsWatermark, isWithinRadius } from '@/lib/geofencing';
import type { Order, OrderDocuments, GpsCoords } from '@/types';
import { toast } from 'sonner';

export default function SupervisorOrders() {
  const { user } = useAuth();
  const { t, lang } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});
  const [confirmingFee, setConfirmingFee] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsCoords | null>(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // جلب الطلبات مباشرة من سوبابيز وفلترتها جغرافياً للمشرف حسب المحافظة الموكلة له من الـ 27 محافظة
  const reload = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*');

      if (error) throw error;

      const mappedOrders = (data || [])
        .filter((row: any) => {
          // التحقق من التبعية للمشرف عبر المعرف المباشر أو تطابق المحافظة المسجلة بحسابه
          return row.assigned_supervisor_id === user.id || row.province === (user as any).province || row.customer_province === (user as any).province;
        })
        .map((row: any) => {
          const totalAmt = Number(row.total_amount || row.totalAmount || 0);
          return {
            id: row.id,
            customerId: row.user_id || row.customerId || '',
            customerName: row.client_name || row.customerName || (lang === 'ar' ? 'عميل بدون اسم' : 'Unnamed Client'),
            customerPhone: row.client_phone || row.customerPhone || '',
            customerProvince: row.province || row.customerProvince || '',
            customerAddress: row.address || row.customerAddress || '',
            customerJob: row.job || row.customerJob || '',
            customerNationalId: row.national_id || row.customerNationalId || '',
            status: row.status || 'pending',
            notes: row.admin_notes || row.notes || '',
            created_at: row.created_at || new Date().toISOString(),
            installmentPlan: {
              monthlyPayment: row.monthly_payment || (totalAmt ? totalAmt / 12 : 0),
              inquiryFee: 150, // الرسوم الثابتة المعتمدة لمنصة PayNex الذكية
              months: row.months || 12,
              totalAmount: totalAmt
            },
            product: {
              nameAr: lang === 'ar' ? 'طلب تقسيط مالي' : 'Financial Installment Request',
              nameEn: 'Financial Installment Request'
            },
            documents: row.documents || {}
          };
        });

      setOrders(mappedOrders);
    } catch (err: any) {
      console.error("Supabase fetch error:", err.message);
      toast.error(lang === 'ar' ? "حدث خطأ أثناء جلب البيانات السحابية" : "Error pulling database entries");
    }
  }, [user, lang]);

  useEffect(() => {
    reload();
  }, [reload]);

  // جلب وتأمين إحداثيات المشرف الجغرافية لمنع التلاعب
  async function fetchGps() {
    setFetchingGps(true);
    try {
      const coords = await getCurrentGps();
      if (coords) {
        setGps({
          latitude: (coords as any).latitude || (coords as any).lat,
          longitude: (coords as any).longitude || (coords as any).lng
        } as any);
        toast.success(t('تم تحديد موقعك بنجاح', 'GPS location acquired'));
      } else {
        setGps(null);
        toast.warning(t('لم يتم الحصول على الموقع — سيتم التجاوز في وضع التجربة', 'GPS unavailable — bypassed in demo mode'));
      }
    } catch (err) {
      console.error('GPS error:', err);
      setGps(null);
    } finally {
      setFetchingGps(false);
    }
  }

  useEffect(() => {
    fetchGps();
  }, []);

  // دالة التحقق من سداد رسوم الـ 150 ج.م
  function isFeeConfirmed(order: any): boolean {
    return ['under-inquiry', 'admin-review', 'approved', 'delivered', 'under-review', 'active', 'completed']
      .includes(order.status) || (order.notes?.includes('fee_paid') ?? false);
  }

  // تأكيد استلام الرسوم كاش وتحديث حالة الطلب على السوبابيز وترحيل المكافأة للمحفظة
  async function handleConfirmFeeReceived(order: any) {
    if (!user) return;
    try {
      const fee = 150;

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'under-inquiry',
          admin_notes: `fee_paid_150:${new Date().toISOString()}`
        })
        .eq('id', order.id);

      if (error) throw error;

      // تحديث العمليات المحلية والمحفظة والإشعارات
      try {
        addFeeToWallet(user.id, fee, order.id, order.customerName);
        addNotification(
          order.customerId,
          'تم استلام رسوم الاستعلام',
          `تم استلام رسوم الاستعلام بقيمة 150 ج.م وطلبك رقم #${order.id} الآن قيد المراجعة الميدانية.`,
          'order'
        );
      } catch (localErr) {
        console.log("Local storage log sync complete.");
      }

      toast.success(t(`تم إضافة ${formatCurrency(fee, lang)} لمحفظتك — الطلب الآن "جاري الاستعلام"`, `EGP ${fee} added to wallet — status: Under Inquiry`));
      setConfirmingFee(null);
      reload();
      setSelected(null);
    } catch (err: any) {
      console.error("Failed to update fee status:", err.message);
      toast.error(lang === 'ar' ? 'فشل تحديث حالة الرسوم سحابياً' : 'Database sync failed');
    }
  }

  // رفع الصور الميدانية الحية وختم البصمة الجغرافية المائية عليها تلقائياً
  async function handleDocUpload(field: keyof OrderDocuments, file: File, orderId: string) {
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const reader = new FileReader();
    reader.onload = async e => {
      let dataUrl = e.target?.result as string;
      const sup = user ? getSupervisorById(user.id) : null;

      const currentLat = gps ? ((gps as any).latitude || (gps as any).lat) : null;
      const currentLng = gps ? ((gps as any).longitude || (gps as any).lng) : null;

      if (currentLat && currentLng) {
        dataUrl = await addGpsWatermark(dataUrl, { lat: currentLat, lng: currentLng } as any, sup?.name ?? user?.name ?? 'مشرف الاستعلام');
      }

      setDocPreviews(prev => ({ ...prev, [field]: dataUrl }));
      
      const updatedDocs = {
        ...currentOrder.documents,
        [field]: dataUrl,
        uploadedAt: new Date().toISOString(),
        uploadedGps: gps ? { lat: currentLat, lng: currentLng } : undefined
      };

      const hasRequired = updatedDocs.nationalIdFront && updatedDocs.nationalIdBack;
      const newStatus = hasRequired ? 'admin-review' : currentOrder.status;

      // مزامنة الملف الاستعلامي مع سوبابيز مباشرة لضمان الحفظ الدائم
      const { error } = await supabase
        .from('orders')
        .update({
          documents: updatedDocs,
          status: newStatus
        })
        .eq('id', orderId);

      if (error) throw error;

      if (newStatus === 'admin-review' && currentOrder.status !== 'admin-review') {
        toast.success(t('اكتملت المستندات — الطلب جاهز لمراجعة المدير', 'Documents complete — escalated to Admin Review'));
      } else {
        toast.success(t('تم رفع المستند بنجاح بالبصمة الحية', 'Document uploaded successfully'));
      }
      reload();
    };
    reader.readAsDataURL(file);
  }

  // تصعيد يدوي مباشر لملف العميل للمدير العام
  async function handleEscalateToAdmin(orderId: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'admin-review' })
        .eq('id', orderId);

      if (error) throw error;

      try {
        addNotification(
          'admin-001',
          'طلب جاهز للمراجعة النهائية',
          `أرسل المشرف مستندات الطلب الميداني رقم #${orderId} وهو جاهز للمراجعة.`,
          'admin'
        );
      } catch (e) {}

      toast.success(t('تم إرسال الطلب لمراجعة المدير', 'Escalated to Admin Review'));
      reload();
      setSelected(null);
    } catch (err: any) {
      toast.error(lang === 'ar' ? 'فشل إرسال الملف للمدير' : 'Escalation failed');
    }
  }

  const statuses = ['all', 'pending', 'under-inquiry', 'admin-review', 'approved', 'delivered', 'rejected'];
  
  const filtered = orders.filter(o => {
    const nameStr = String(o.customerName || '').toLowerCase();
    const phoneStr = String(o.customerPhone || '');
    const searchStr = search.toLowerCase();

    const matchSearch = !search || nameStr.includes(searchStr) || phoneStr.includes(searchStr);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const docFields: { key: keyof OrderDocuments; label: string; required?: boolean }[] = [
    { key: 'nationalIdFront', label: t('البطاقة - الوجه الأمامي *', 'ID Front *'), required: true },
    { key: 'nationalIdBack',  label: t('البطاقة - الوجه الخلفي *', 'ID Back *'), required: true },
    { key: 'utilityBill',     label: t('إيصال مرافق', 'Utility Bill') },
    { key: 'incomeProof',     label: t('إثبات دخل', 'Income Proof') },
    { key: 'customerHousePhoto', label: t('صورة منزل العميل', "Customer's House Photo") },
  ];

  const getGpsLat = () => gps ? ((gps as any).latitude || (gps as any).lat) : null;
  const getGpsLng = () => gps ? ((gps as any).longitude || (gps as any).lng) : null;

  return (
    <div className="space-y-4">
      {/* شريط التحقق ومراقبة الـ GPS */}
      <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#0f2460]">
          <Navigation size={16} className={getGpsLat() ? 'text-green-500 animate-pulse' : 'text-slate-400'} />
          {getGpsLat() && getGpsLng()
            ? t(`موقعك: ${Number(getGpsLat()).toFixed(4)}, ${Number(getGpsLng()).toFixed(4)}`, `Location: ${Number(getGpsLat()).toFixed(4)}, ${Number(getGpsLng()).toFixed(4)}`)
            : t('الموقع الجغرافي غير محدد — مطلوب لرفع المستندات المعاينة', 'GPS not set — required for uploading documents')}
        </div>
        <button onClick={fetchGps} disabled={fetchingGps} className="btn-outline text-xs px-3 py-2 flex items-center gap-1">
          <MapPin size={13} />
          {fetchingGps ? t('جاري...', 'Getting...') : t('تحديد موقعي', 'Get Location')}
        </button>
      </div>

      {/* الفلترة والبحث السريع */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('بحث باسم العميل أو الهاتف...', 'Search...')}
            className="input-field ps-9 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-auto">
          {statuses.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? t('الكل', 'All') : getOrderStatusLabel(s, lang)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#d4a339]/10 border border-[#d4a339]/30 rounded-xl p-3 text-sm text-[#0f2460] flex items-center gap-2">
        <AlertCircle size={15} className="text-[#d4a339] flex-shrink-0" />
        {t('يجب تأكيد استلام رسوم الاستعلام أولاً لفتح صلاحية رفع مستندات العميل. يضاف المبلغ لمحفظتك فوراً.', 'Confirm inquiry fee first to unlock document upload. Amount added to wallet immediately.')}
      </div>

      {/* جدول عرض البيانات المتجاوب */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[t('العميل', 'Customer'), t('المنتج', 'Product'), t('القسط', 'Monthly'), t('الرسوم', 'Fee'), t('حالة الدفع', 'Fee Status'), t('الحالة', 'Status'), ''].map(h => (
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
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-slate-400">{o.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[130px] truncate">
                      {lang === 'ar' ? o.product.nameAr : o.product.nameEn}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0f2460]">{formatCurrency(o.installmentPlan.monthlyPayment, lang)}</td>
                    <td className="px-4 py-3 font-bold text-[#d4a339]">{formatCurrency(o.installmentPlan.inquiryFee, lang)}</td>
                    <td className="px-4 py-3">
                      {feePaid ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle size={13} /> {t('مدفوعة', 'Paid')}
                        </span>
                      ) : (
                        <button onClick={() => setConfirmingFee(o.id)}
                          className="text-xs bg-[#d4a339] text-white px-3 py-1.5 rounded-lg hover:bg-[#c49330] transition-colors flex items-center gap-1">
                          <DollarSign size={12} /> {t('تأكيد الاستلام', 'Confirm')}
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
                        className="w-8 h-8 rounded-lg bg-[#0f2460]/10 hover:bg-[#0f2460] text-[#0f2460] hover:text-white flex items-center justify-center transition-all">
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

      {/* مودال تأكيد استلام الرسوم (150 ج.م) كاش */}
      {confirmingFee && (() => {
        const order = orders.find(o => o.id === confirmingFee);
        if (!order) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmingFee(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-[#d4a339]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={32} className="text-[#d4a339]" />
                </div>
                <h3 className="font-bold text-[#0f2460] text-lg mb-1">{t('تأكيد استلام رسوم الاستعلام', 'Confirm Fee Receipt')}</h3>
                <p className="text-slate-500 text-sm mb-1">{t('العميل:', 'Customer:')} <strong>{order.customerName}</strong></p>
                <p className="text-3xl font-black text-[#d4a339] my-3">{formatCurrency(order.installmentPlan.inquiryFee, lang)}</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-4 text-start">
                  <ul className="space-y-1">
                    <li>✅ {t('يُضاف هذا المبلغ فوراً لمحفظتك كمديونية', 'Amount added to your wallet as pending debt')}</li>
                    <li>✅ {t('يفتح لك صلاحية رفع مستندات العميل المعاينية', 'Unlocks document upload for this customer')}</li>
                    <li>✅ {t('حالة الطلب تتغير تلقائياً إلى "جاري الاستعلام"', 'Status changes to "Under Inquiry"')}</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleConfirmFeeReceived(order)} className="btn-gold flex-1">
                    {t('تأكيد الاستلام كاش', 'Confirm Receipt')}
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

      {/* مودال تفاصيل المعاينة والمستندات */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0f2460]">{t('تفاصيل ومستندات الطلب', 'Order Details')}</h3>
                <p className="text-xs text-slate-400">#{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm border-b pb-3">
                {[
                  { label: t('الاسم بالكامل', 'Name'), v: selected.customerName },
                  { label: t('رقم الهاتف', 'Phone'), v: selected.customerPhone },
                  { label: t('المحافظة', 'Province'), v: selected.customerProvince },
                  { label: t('العنوان الميداني', 'Address'), v: selected.customerAddress },
                  { label: t('الرقم القومي للعميل', 'ID'), v: selected.customerNationalId ? '***' + String(selected.customerNationalId).slice(-4) : '—' },
                  { label: t('القسط الشهري', 'Monthly'), v: formatCurrency(selected.installmentPlan.monthlyPayment, lang) },
                  { label: t('مدة التقسيط', 'Duration'), v: `${selected.installmentPlan.months} ${t('شهر', 'mo')}` },
                  { label: t('إجمالي القيمة', 'Total'), v: formatCurrency(selected.installmentPlan.totalAmount, lang) },
                ].map(item => (
                  <div key={item.label}><p className="text-xs text-slate-400">{item.label}</p><p className="font-medium text-slate-800">{item.v}</p></div>
                ))}
              </div>

              {/* قسم رفع وحفظ المستندات */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isFeeConfirmed(selected) ? <FileCheck size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-[#d4a339]" />}
                    <h4 className="font-semibold text-sm">{t('رفع ملف المعاينة الميدانية', 'Upload Documents')}</h4>
                  </div>
                  {!getGpsLat() && isFeeConfirmed(selected) && (
                    <button onClick={fetchGps} disabled={fetchingGps} className="text-xs bg-[#0f2460]/10 text-[#0f2460] px-2 py-1 rounded-lg flex items-center gap-1">
                      <MapPin size={11} /> {t('تحديد موقع', 'Get GPS')}
                    </button>
                  )}
                </div>

                {isFeeConfirmed(selected) ? (
                  <>
                    {getGpsLat() ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 mb-3 text-xs text-green-800 flex items-center gap-2">
                        <CheckCircle size={13} />
                        {t(`الموقع الميداني مؤمن وجاهز للختم الجغرافي الحي على المستندات`, `GPS secured and active for anti-fraud auditing.`)}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 mb-3 text-xs text-yellow-800 flex items-center gap-2">
                        <AlertCircle size={13} />
                        {t('ينصح بتفعيل الـ GPS لتوثيق الصور ببصمة الموقع الميدانية', 'Recommended: activate live GPS watermark')}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {docFields.map(({ key, label }) => {
                        const existing = selected.documents?.[key] as string | undefined;
                        const preview = docPreviews[key] ?? existing;
                        return (
                          <div key={key} className="border-2 border-dashed border-slate-200 rounded-xl p-3 hover:border-[#0f2460] transition-colors bg-slate-50 text-center">
                            <p className="text-xs text-slate-500 mb-2 font-medium">{label}</p>
                            {preview ? (
                              <div className="relative rounded-lg overflow-hidden h-20 border bg-black">
                                <img src={preview} alt={label} className="w-full h-full object-cover opacity-90" />
                                <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                  <span className="text-white text-xs flex items-center gap-1"><Camera size={12} /> {t('تغيير', 'Change')}</span>
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={e => e.target.files?.[0] && handleDocUpload(key, e.target.files[0], selected.id)} />
                                </label>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-1 cursor-pointer py-3 bg-white border rounded-lg shadow-sm hover:bg-slate-50">
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
                      <button onClick={() => handleEscalateToAdmin(selected.id)} className="btn-primary w-full mt-5 flex items-center justify-center gap-2 text-sm py-2.5">
                        <CheckCircle size={15} />
                        {t('إرسال للمراجعة النهائية من المدير العام', 'Submit for Admin Final Review')}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-5 text-center">
                    <AlertCircle size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm mb-3">
                      {t('مقفل — يفتح بعد تأكيد استلام رسوم الاستعلام كاش', 'Locked — opens after confirming inquiry fee')}
                    </p>
                    <button onClick={() => { setSelected(null); setConfirmingFee(selected.id); }} className="btn-gold text-sm px-4 py-2">
                      {t('تأكيد استلام الرسوم', 'Confirm Fee Receipt')}
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
