import { useState, useEffect, useCallback } from 'react';
import {
  Eye, DollarSign, Upload, FileCheck, Search, AlertCircle,
  CheckCircle, MapPin, X, Camera, Navigation
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { getCurrentGps, addGpsWatermark } from '@/lib/geofencing';
import type { OrderDocuments, GpsCoords } from '@/types';
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

  // 1. جلب البيانات والفلترة الجغرافية الحقيقية حسب محافظة المشرف
  const reload = useCallback(async () => {
    if (!user) return;
    try {
      const supervisorProvince = (user as any).province || '';

      const { data, error } = await supabase
        .from('orders')
        .select('*');

      if (error) throw error;

      const mappedOrders = (data || [])
        .filter((row: any) => {
          const orderProvince = row.province || row.customer_province || '';
          return orderProvince.trim() === supervisorProvince.trim() || row.assigned_supervisor_id === user.id;
        })
        .map((row: any) => {
          const totalAmt = Number(row.total_amount || 0);
          return {
            id: row.id,
            customerId: row.user_id || '',
            customerName: row.client_name || (lang === 'ar' ? 'عميل بدون اسم' : 'Unnamed Client'),
            customerPhone: row.client_phone || '',
            customerProvince: row.province || '',
            customerAddress: row.address || '',
            customerNationalId: row.national_id || '',
            status: row.status || 'pending',
            notes: row.admin_notes || '',
            created_at: row.created_at || new Date().toISOString(),
            installmentPlan: {
              monthlyPayment: totalAmt ? totalAmt / 12 : 0,
              inquiryFee: 150,
              months: 12,
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

      // تحديث الكائن المختار داخل المودال إذا كان مفتوحاً لضمان مزامنة البيانات والـ UI
      if (selected) {
        const currentSelected = mappedOrders.find(o => o.id === selected.id);
        if (currentSelected) {
          setSelected(currentSelected);
        }
      }
    } catch (err: any) {
      console.error("Supabase Database fetch failure:", err.message);
      toast.error(lang === 'ar' ? "حدث خطأ أثناء الاتصال بقاعدة البيانات" : "Database error");
    }
  }, [user, lang, selected]);

  useEffect(() => {
    reload();
  }, [user, reload]);

  // دالة تتبع الـ GPS للمعاينة
  async function fetchGps() {
    setFetchingGps(true);
    try {
      const coords = await getCurrentGps();
      if (coords) {
        setGps({
          latitude: (coords as any).latitude || (coords as any).lat,
          longitude: (coords as any).longitude || (coords as any).lng
        } as any);
      } else {
        setGps(null);
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

  // دالة فحص السداد الحقيقية
  function isFeeConfirmed(order: any): boolean {
    if (!order) return false;
    return ['under-inquiry', 'admin-review', 'approved', 'delivered', 'under-review', 'active', 'completed']
      .includes(order.status) || (order.notes?.includes('fee_paid') ?? false);
  }

  // 2. تأكيد استلام الرسوم كاش سحابياً وتحديث الواجهة لحظياً
  async function handleConfirmFeeReceived(order: any) {
    if (!user) return;
    try {
      const feeAmount = 150;
      const nowIso = new Date().toISOString();
      const updatedNotes = `fee_paid_150:${nowIso}`;

      // أولاً: التحديث الفوري في السيرفر لجدول orders
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          status: 'under-inquiry',
          admin_notes: updatedNotes
        })
        .eq('id', order.id);

      if (orderUpdateError) throw orderUpdateError;

      // ثانياً: زيادة مديونية/عهدة المشرف بـ 150 ج.م حقيقياً في السيرفر بجدول supervisors
      const { data: supervisorData, error: supFetchError } = await supabase
        .from('supervisors')
        .select('pending_debt')
        .eq('id', user.id)
        .single();

      if (!supFetchError && supervisorData) {
        const currentDebt = Number(supervisorData.pending_debt || 0);
        await supabase
          .from('supervisors')
          .update({ pending_debt: currentDebt + feeAmount })
          .eq('id', user.id);
      }

      // تحديث الـ state الحالي محلياً فوراً لفتح المودال والرفع في نفس الملي ثانية دون أي حلقة مفرغة
      const updatedOrder = {
        ...order,
        status: 'under-inquiry',
        notes: updatedNotes
      };

      setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
      
      if (selected && selected.id === order.id) {
        setSelected(updatedOrder);
      }

      toast.success(lang === 'ar' ? `تم إدراج 150 ج.م في عهدتك المادية — تم تفعيل واجهة الرفع` : `150 EGP registered in custody.`);
      setConfirmingFee(null);

      await reload();
    } catch (err: any) {
      console.error("Critical Transaction Failure:", err.message);
      toast.error(lang === 'ar' ? 'فشل معالجة حركة العهدة السحابية' : 'Cloud sync failure');
    }
  }

  // 3. رفع وحفظ مستندات العميل الميدانية حقيقياً في السوبابيز
  async function handleDocUpload(field: keyof OrderDocuments, file: File, orderId: string) {
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const reader = new FileReader();
    reader.onload = async e => {
      let dataUrl = e.target?.result as string;

      const currentLat = gps ? ((gps as any).latitude || (gps as any).lat) : null;
      const currentLng = gps ? ((gps as any).longitude || (gps as any).lng) : null;

      if (currentLat && currentLng) {
        dataUrl = await addGpsWatermark(dataUrl, { lat: currentLat, lng: currentLng } as any, user?.name || 'مشرف الاستعلام');
      }

      setDocPreviews(prev => ({ ...prev, [field]: dataUrl }));
      
      const updatedDocs = {
        ...currentOrder.documents,
        [field]: dataUrl,
        uploadedAt: new Date().toISOString()
      };

      const { error: uploadError } = await supabase
        .from('orders')
        .update({ documents: updatedDocs })
        .eq('id', orderId);

      if (uploadError) throw uploadError;

      const updatedOrder = { ...currentOrder, documents: updatedDocs };
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      if (selected && selected.id === orderId) {
        setSelected(updatedOrder);
      }

      toast.success(t('تم حفظ وتثبيت المستند سحابياً بنجاح', 'Document secured on cloud'));
    };
    reader.readAsDataURL(file);
  }

  // تصعيد كلي لملف المعاينة الرقمي للمدير العام
  async function handleEscalateToAdmin(orderId: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'admin-review' })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(t('تم تصعيد الملف بالكامل للإدارة العليا', 'Submitted to Admin'));
      reload();
      setSelected(null);
    } catch (err: any) {
      toast.error(lang === 'ar' ? 'فشل تصعيد الملف' : 'Escalation failed');
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

  const docFields: { key: keyof OrderDocuments; label: string }[] = [
    { key: 'nationalIdFront', label: t('البطاقة - الوجه الأمامي *', 'ID Front *') },
    { key: 'nationalIdBack',  label: t('البطاقة - الوجه الخلفي *', 'ID Back *') },
    { key: 'utilityBill',     label: t('إيصال مرافق حديث', 'Utility Bill') },
    { key: 'incomeProof',     label: t('إثبات دخل أو مفردات مرتب', 'Income Proof') },
    { key: 'customerHousePhoto', label: t('صورة منزل العميل من الطبيعة', "House Photo") },
  ];

  return (
    <div className="space-y-4">
      {/* مراقبة الـ GPS الحي */}
      <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#0f2460]">
          <Navigation size={16} className={gps ? 'text-green-500 animate-pulse' : 'text-slate-400'} />
          {gps
            ? t(`موقعك الميداني مفعّل: ${Number((gps as any).latitude || (gps as any).lat).toFixed(4)}`, 'GPS active')
            : t('الموقع الجغرافي غير محدد — مطلوب لتوثيق صور المعاينة', 'GPS location required')}
        </div>
        <button onClick={fetchGps} disabled={fetchingGps} className="btn-outline text-xs px-3 py-2 flex items-center gap-1">
          <MapPin size={13} />
          {fetchingGps ? t('جاري التحديد...', 'Getting...') : t('تحديد موقعي', 'Get Location')}
        </button>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('بحث باسم العميل أو رقم الهاتف...', 'Search...')}
            className="input-field ps-9 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-auto">
          {statuses.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? t('كل الحالات', 'All') : getOrderStatusLabel(s, lang)}
            </option>
          ))}
        </select>
      </div>

      {/* جدول البيانات المتجاوب */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[t('العميل', 'Customer'), t('المحافظة', 'Province'), t('إجمالي القيمة', 'Total Amount'), t('رسوم الاستعلام', 'Inquiry Fee'), t('حالة الرسوم', 'Fee Status'), t('الحالة', 'Status'), ''].map(h => (
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
                      <div className="font-medium text-slate-800">{o.customerName}</div>
                      <div className="text-xs text-slate-400 font-mono">{o.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{o.customerProvince}</td>
                    <td className="px-4 py-3 font-bold text-[#0f2460]">{formatCurrency(o.installmentPlan.totalAmount, lang)}</td>
                    <td className="px-4 py-3 font-bold text-[#d4a339]">{formatCurrency(o.installmentPlan.inquiryFee, lang)}</td>
                    <td className="px-4 py-3">
                      {feePaid ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                          <CheckCircle size={13} /> {t('مستلمة (بالعهدة)', 'In Custody')}
                        </span>
                      ) : (
                        <button onClick={() => setConfirmingFee(o.id)}
                          className="text-xs bg-[#d4a339] text-white px-3 py-1.5 rounded-lg hover:bg-[#c49330] transition-colors flex items-center gap-1 font-medium shadow-sm">
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
            <div className="text-center py-10 text-slate-400 text-sm">{t('لا توجد طلبات معلقة بمحافظتك الحالية', 'No orders found')}</div>
          )}
        </div>
      </div>

      {/* مودال تأكيد استلام الرسوم */}
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
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-4 text-start leading-relaxed">
                  <p className="font-bold mb-1">🔗 الأثر المالي والسحابي الفوري للعملية:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>تُسجل كعهدة مالية مستلمة بذمتك في جدول المشرفين بالسيرفر.</li>
                    <li>تتحول حالة الطلب سحابياً إلى "جاري الاستعلام".</li>
                    <li>فتح صلاحية تصوير ورفع المستندات الميدانية للعميل فوراً.</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleConfirmFeeReceived(order)} className="btn-gold flex-1 text-sm font-medium">
                    {t('تأكيد الاستلام والنزول بالعهدة', 'Confirm & Custody')}
                  </button>
                  <button onClick={() => setConfirmingFee(null)} className="btn-outline flex-1 text-sm font-medium">
                    {t('إلغاء', 'Cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* مودال رفع ملفات المعاينة الميدانية */}
      {selected && (() => {
        const feePaid = isFeeConfirmed(selected);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#0f2460]">{t('تفاصيل ومستندات طلب المعاينة', 'Inquiry Details')}</h3>
                  <p className="text-xs text-slate-400">#{selected.id} — {selected.customerName}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm border-b pb-3">
                  {[
                    { label: t('الاسم بالكامل', 'Name'), v: selected.customerName },
                    { label: t('رقم الهاتف', 'Phone'), v: selected.customerPhone },
                    { label: t('المحافظة جغرافياً', 'Province'), v: selected.customerProvince },
                    { label: t('عنوان المعاينة الميداني', 'Address'), v: selected.customerAddress },
                    { label: t('إجمالي القيمة المطلوب تقسيطها', 'Total'), v: formatCurrency(selected.installmentPlan.totalAmount, lang) },
                  ].map(item => (
                    <div key={item.label}><p className="text-xs text-slate-400">{item.label}</p><p className="font-medium text-slate-800">{item.v}</p></div>
                  ))}
                </div>

                <div className="pt-1">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-slate-700">
                    <Camera size={16} className="text-slate-500" />
                    {t('رفع وثائق وملفات العميل من الطبيعة المعاينية:', 'Upload Documents:')}
                  </h4>

                  {feePaid ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {docFields.map(({ key, label }) => {
                          const existing = selected.documents?.[key] as string | undefined;
                          const preview = docPreviews[key] ?? existing;
                          return (
                            <div key={key} className="border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 text-center hover:border-[#0f2460] transition-all">
                              <p className="text-xs text-slate-500 mb-2 font-medium">{label}</p>
                              {preview ? (
                                <div className="relative rounded-lg overflow-hidden h-20 border bg-black">
                                  <img src={preview} alt={label} className="w-full h-full object-cover opacity-90" />
                                  <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                    <span className="text-white text-xs flex items-center gap-1"><Camera size={12} /> {t('تعديل الصورة', 'Change')}</span>
                                    <input type="file" accept="image/*" className="hidden"
                                      onChange={e => e.target.files?.[0] && handleDocUpload(key, e.target.files[0], selected.id)} />
                                  </label>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center gap-1 cursor-pointer py-3 bg-white border rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                                  <Upload size={18} className="text-slate-400" />
                                  <span className="text-xs text-slate-400">{t('التقاط الصورة حياً', 'Capture')}</span>
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={e => e.target.files?.[0] && handleDocUpload(key, e.target.files[0], selected.id)} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {selected.status === 'under-inquiry' && (
                        <button onClick={() => handleEscalateToAdmin(selected.id)} className="btn-primary w-full mt-5 flex items-center justify-center gap-2 text-sm py-2.5 font-semibold">
                          <CheckCircle size={15} />
                          {t('تصعيد وإرسال الملف للمراجعة الإدارية النهائية', 'Escalate to General Management')}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-5 text-center border border-dashed border-slate-200">
                      <AlertCircle size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm mb-3 font-medium">
                        {t('صلاحية رفع صور المعاينة مقفلة — تفتح تلقائياً فور تأكيد استلام رسوم الاستعلام كاش ونزولها في عهدتك ماليًا', 'Locked — confirm fee first')}
                      </p>
                      <button onClick={() => { setConfirmingFee(selected.id); }} className="btn-gold text-xs px-4 py-2 font-semibold">
                        {t('تأكيد استلام رسوم الاستعلام الآن (150 ج.م)', 'Confirm Fee Receipt Now')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
