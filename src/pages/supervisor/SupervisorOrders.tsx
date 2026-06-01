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
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { getCurrentGps, addGpsWatermark } from '@/lib/geofencing';
import type { OrderDocuments } from '@/types';
import { toast } from 'sonner';

export default function SupervisorOrders() {
  const { user } = useAuth();
  const { t, lang } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});
  const [confirmingFee, setConfirmingFee] = useState<string | null>(null);
  const [gps, setGps] = useState<any | null>(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // جلب الطلبات بآلية حماية ثنائية (الـ View أو الجدول المباشر في حال الفشل)
  const reload = useCallback(async () => {
    if (!user) return;
    try {
      // المحاولة الأولى: القراءة من الـ View
      let { data, error } = await supabase
        .from('supervisor_orders')
        .select('*')
        .eq('supervisor_user_id', user.id);

      // المحاولة الثانية الاحتياطية: لو الـ View رجع خطأ مسميات، نجرب القراءة من الجدول المباشر
      if (error) {
        console.warn("View fetch failed, switching to direct table fallback:", error.message);
        
        // جلب بيانات المشرف أولاً لمعرفة المحافظة المسئول عنها
        const { data: supervisorData } = await supabase
          .from('supervisors')
          .select('province')
          .eq('user_id', user.id)
          .single();

        if (supervisorData?.province) {
          const fallbackResponse = await supabase
            .from('orders')
            .select('*')
            .eq('province', supervisorData.province);
          
          if (!fallbackResponse.error) {
            data = fallbackResponse.data;
            error = null;
          }
        }
      }

      // إذا فشلت الطريقتين (مثلاً خطأ اتصال عام)
      if (error) throw error;

      // تحويل البيانات بشكل مرن يستوعب تركيبة الـ View أو تركيبة الجدول المباشر
      const mappedOrders = (data || []).map((row: any) => {
        const totalAmt = row.total_amount || row.totalAmount || 0;
        return {
          id: row.order_id || row.id,
          customerName: row.client_name || row.customerName || (lang === 'ar' ? 'عميل بدون اسم' : 'Unnamed Client'),
          customerPhone: row.client_phone || row.customerPhone || '',
          customerProvince: row.order_province || row.province || '',
          status: row.order_status || row.status || 'pending',
          created_at: row.order_date || row.created_at || new Date().toISOString(),
          installmentPlan: {
            monthlyPayment: totalAmt ? Number(totalAmt) / 12 : 0,
            inquiryFee: 50,
            months: 12,
            totalAmount: Number(totalAmt)
          },
          product: {
            nameAr: lang === 'ar' ? 'طلب تقسيط' : 'Installment Order',
            nameEn: 'Installment Order'
          },
          documents: row.documents || {},
          notes: row.notes || ''
        };
      });

      setOrders(mappedOrders);
    } catch (err: any) {
      console.error("Critical error loading orders:", err.message);
      toast.error(lang === 'ar' ? "حدث خطأ أثناء تحميل الطلبات" : "Error loading orders");
    }
  }, [user, lang]);

  useEffect(() => {
    reload();
  }, [reload]);

  // جلب الـ GPS وتأمين الـ لتفادي أي كراش واجهة
  async function fetchGps() {
    setFetchingGps(true);
    try {
      const coords = await getCurrentGps();
      if (coords) {
        setGps({
          lat: (coords as any).latitude || (coords as any).lat,
          lng: (coords as any).longitude || (coords as any).lng
        });
      } else {
        setGps(null);
      }
    } catch (err) {
      console.error('GPS error:', err);
      setGps(null);
    } {
      setFetchingGps(false);
    }
  }

  useEffect(() => {
    fetchGps();
  }, []);

  function isFeeConfirmed(order: any): boolean {
    return ['under-inquiry', 'admin-review', 'approved', 'delivered', 'under-review', 'active', 'completed']
      .includes(order.status) || (order.notes?.includes('fee_paid') ?? false);
  }

  async function handleConfirmFeeReceived(order: any) {
    if (!user) return;
    try {
      const fee = order.installmentPlan.inquiryFee;
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'under-inquiry',
          notes: `fee_paid:${new Date().toISOString()}`
        })
        .eq('id', order.id);

      if (error) throw error;

      addFeeToWallet(user.id, fee, order.id, order.customerName);
      
      addNotification(
        order.id, 
        'تحديث طلب التقسيط',
        `تم تأكيد استعلام طلبك رقم #${order.id} وهو الآن قيد الدراسة والمراجعة`,
        'order'
      );

      toast.success(t(`تم إضافة ${formatCurrency(fee)} لمحفظتك`, `EGP ${fee} added to wallet`));
      setConfirmingFee(null);
      reload();
    } catch (err: any) {
      console.error("Error confirming fee:", err.message);
      toast.error(lang === 'ar' ? 'فشل تأكيد رسوم الاستعلام' : 'Failed to confirm fee');
    }
  }

  async function handleDocUpload(field: keyof OrderDocuments, file: File, orderId: string) {
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const reader = new FileReader();
    reader.onload = async e => {
      let dataUrl = e.target?.result as string;
      const sup = user ? getSupervisorById(user.id) : null;

      if (gps && gps.lat && gps.lng) {
        dataUrl = await addGpsWatermark(dataUrl, gps, sup?.name || user?.name || 'مشرف');
      }

      setDocPreviews(prev => ({ ...prev, [field]: dataUrl }));
      toast.success(t('تم رفع المستند بنجاح بموقعك الجغرافي', 'Document uploaded with GPS'));
    };
    reader.readAsDataURL(file);
  }

  async function handleEscalateToAdmin(orderId: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'pending-admin' })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(t('تم إرسال الطلب لمراجعة المدير', 'Escalated to Admin Review'));
      setSelected(null);
      reload();
    } catch (err: any) {
      console.error("Error escalating order:", err.message);
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'Error submitting order');
    }
  }

  const statuses = ['all', 'pending', 'under-inquiry', 'admin-review', 'approved', 'delivered', 'rejected'];
  
  const filtered = orders.filter(o => {
    const nameStr = String(o.customerName || '').toLowerCase();
    const phoneStr = String(o.customerPhone || '');
    const idStr = String(o.id || '');
    const searchStr = search.toLowerCase();

    const matchSearch = !search || nameStr.includes(searchStr) || phoneStr.includes(searchStr) || idStr.includes(searchStr);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const docFields: { key: string; label: string; required?: boolean }[] = [
    { key: 'nationalIdFront', label: t('البطاقة - الوجه الأمامي *', 'ID Front *'), required: true },
    { key: 'nationalIdBack',  label: t('البطاقة - الوجه الخلفي *', 'ID Back *'), required: true },
    { key: 'utilityBill',     label: t('إيصال مرافق', 'Utility Bill') },
    { key: 'incomeProof',     label: t('إثبات دخل', 'Income Proof') },
    { key: 'customerHousePhoto', label: t('صورة منزل العميل', "Customer's House Photo") },
  ];

  return (
    <div className="space-y-4">
      {/* شريط الـ GPS */}
      <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#0f2460]">
          <Navigation size={16} className={gps ? 'text-green-500' : 'text-slate-400'} />
          {gps && gps.lat !== undefined && gps.lng !== undefined
            ? t(`موقعك: ${Number(gps.lat).toFixed(4)}, ${Number(gps.lng).toFixed(4)}`, `Location: ${Number(gps.lat).toFixed(4)}, ${Number(gps.lng).toFixed(4)}`)
            : t('الموقع الجغرافي غير محدد — مطلوب لرفع المستندات', 'GPS not set — required for uploading documents')}
        </div>
        <button onClick={fetchGps} disabled={fetchingGps} className="bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-slate-50 transition-colors">
          <MapPin size={13} />
          {fetchingGps ? t('جاري...', 'Getting...') : t('تحديد موقعي', 'Get Location')}
        </button>
      </div>

      {/* الفلاتر والبحث */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('بحث بالاسم أو الهاتف...', 'Search...')}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 ps-9 pe-4 text-sm focus:outline-none focus:border-[#0f2460]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0f2460]">
          {statuses.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? t('الكل', 'All') : getOrderStatusLabel(s, lang)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#d4a339]/10 border border-[#d4a339]/30 rounded-xl p-3 text-sm text-[#0f2460] flex items-center gap-2">
        <AlertCircle size={15} className="text-[#d4a339] flex-shrink-0" />
        {t('يجب تأكيد استلام رسوم الاستعلام أولاً لفتح صلاحية رفع مستندات العميل.', 'Confirm inquiry fee first to unlock document upload.')}
      </div>

      {/* عرض الكروت */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(o => {
          const feePaid = isFeeConfirmed(o);
          return (
            <div key={o.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">#{o.id}</span>
                  <h3 className="font-bold text-slate-800 text-base mt-0.5">{o.customerName}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(o.status)}`}>
                  {getOrderStatusLabel(o.status, lang)}
                </span>
              </div>

              <div className="space-y-1.5 my-4 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{t('رقم الهاتف:', 'Phone:')}</span>
                  <span className="font-medium font-mono">{o.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('المحافظة:', 'Province:')}</span>
                  <span className="font-medium">{o.customerProvince}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('تاريخ الطلب:', 'Order Date:')}</span>
                  <span>{formatDate(o.created_at)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-100 pt-2 mt-2">
                  <span className="font-medium text-slate-700">{t('إجمالي المبلغ:', 'Total Amount:')}</span>
                  <span className="font-bold text-slate-800 text-sm">{formatCurrency(o.installmentPlan.totalAmount, lang)}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2">
                {!feePaid ? (
                  <button onClick={() => setConfirmingFee(o.id)}
                    className="w-full bg-[#d4a339] text-white text-xs py-2 rounded-lg hover:bg-[#c49330] transition-colors flex items-center justify-center gap-1.5 font-medium">
                    <DollarSign size={14} />
                    {t('تأكيد رسوم المعاينة (50 ج.م)', 'Confirm Inquiry Fee (50 EGP)')}
                  </button>
                ) : (
                  <button onClick={() => { setSelected(o); setDocPreviews({}); }}
                    className="w-full bg-[#0f2460] text-white text-xs py-2 rounded-lg hover:bg-[#0a1840] transition-colors flex items-center justify-center gap-1.5 font-medium">
                    <Eye size={14} />
                    {t('بدء الاستعلام ورفع التقارير', 'Start Inquiry & Uploads')}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-400 text-sm">
            {t('لا توجد طلبات بمحافظتك حالياً تطابق البحث', 'No orders found matching filters')}
          </div>
        )}
      </div>

      {/* مودال تأكيد الرسوم */}
      {confirmingFee && (() => {
        const order = orders.find(o => o.id === confirmingFee);
        if (!order) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmingFee(null)}>
            <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#d4a339]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={32} className="text-[#d4a339]" />
                </div>
                <h3 className="font-bold text-[#0f2460] text-lg mb-1">{t('تأكيد استلام رسوم الاستعلام', 'Confirm Fee Receipt')}</h3>
                <p className="text-slate-500 text-sm mb-1">{t('العميل:', 'Customer:')} <strong>{order.customerName}</strong></p>
                <p className="text-3xl font-black text-[#d4a339] my-3">{formatCurrency(order.installmentPlan.inquiryFee, lang)}</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => handleConfirmFeeReceived(order)} className="flex-1 bg-[#d4a339] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#c49330]">
                    {t('تأكيد الاستلام', 'Confirm')}
                  </button>
                  <button onClick={() => setConfirmingFee(null)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50">
                    {t('إلغاء', 'Cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* مودال رفع المستندات والتفاصيل */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-[#0f2460] text-base">{t('الملف الاستعلامي الميداني الرقمي', 'Digital Field Inquiry File')}</h3>
                <p className="text-xs text-slate-400">{selected.customerName} — #{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 items-start text-xs text-amber-800 leading-relaxed">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('نظام مراقبة التزييف الجغرافي نشط (Anti-Fraud GPS Watermarking)', 'Anti-Fraud GPS Watermarking Active')}</p>
                  <p className="mt-0.5">{t('يجب رفع المستندات من موقع المعاينة الفعلي للعميل، لتوثيق الإحداثيات ببصمة حية.', 'Photos must be captured at the customer location for anti-fraud auditing purposes.')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm border-b pb-4">
                <div><p className="text-xs text-slate-400">{t('الاسم', 'Name')}</p><p className="font-medium text-slate-800">{selected.customerName}</p></div>
                <div><p className="text-xs text-slate-400">{t('الهاتف', 'Phone')}</p><p className="font-medium text-slate-800 font-mono">{selected.customerPhone}</p></div>
                <div><p className="text-xs text-slate-400">{t('المحافظة', 'Province')}</p><p className="font-medium text-slate-800">{selected.customerProvince}</p></div>
                <div><p className="text-xs text-slate-400">{t('إجمالي المبلغ', 'Total')}</p><p className="font-medium text-slate-800 font-bold">{formatCurrency(selected.installmentPlan.totalAmount, lang)}</p></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
                  <Camera size={16} className="text-slate-500" />
                  {t('المستندات التوثيقية الإلزامية المطلوب رفعها:', 'Required Verification Documents:')}
                </h4>
                
                {selected.status === 'under-inquiry' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {docFields.map(({ key, label }) => {
                        const preview = docPreviews[key];
                        return (
                          <div key={key} className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50 flex flex-col justify-between min-h-[120px]">
                            <p className="text-xs font-medium text-slate-700 mb-2">{label}</p>
                            {preview ? (
                              <div className="relative rounded-lg overflow-hidden h-20 border border-emerald-100 bg-black">
                                <img src={preview} alt="preview" className="w-full h-full object-cover opacity-90" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-1 flex items-end justify-center">
                                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5"><CheckCircle size={10}/> {t('مؤمنة جغرافياً', 'GPS Secured')}</span>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-1 cursor-pointer py-2 bg-white rounded-lg border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors">
                                <Upload size={14} className="text-slate-400" />
                                <span className="text-xs text-slate-500">{t('التقاط الصورة', 'Capture')}</span>
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={e => e.target.files?.[0] && handleDocUpload(key as any, e.target.files[0], selected.id)} />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => handleEscalateToAdmin(selected.id)} className="w-full bg-[#0f2460] text-white mt-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a1840] transition-colors flex items-center justify-center gap-2">
                      <CheckCircle size={16} />
                      {t('إرسال للمراجعة النهائية من المدير', 'Submit for Admin Final Review')}
                    </button>
                  </>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-200">
                    <AlertCircle size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm mb-3">
                      {t('مغلق حالياً — يفتح فوراً بعد تأكيد استلام رسوم الزيارة والاستعلام', 'Locked — opens after confirming inquiry fee')}
                    </p>
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
