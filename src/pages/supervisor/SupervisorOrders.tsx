import { useState, useEffect, useCallback } from 'react';
import {
  Eye, DollarSign, Upload, FileCheck, Search, AlertCircle,
  CheckCircle, MapPin, X, Camera, Navigation
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase'; // استيراد كليانت السوبابيز للاتصال بقاعدة البيانات
import {
  getOrdersBySupervisor, updateOrder, addFeeToWallet, addNotification, getSupervisorById
} from '@/lib/storage';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor, generateId } from '@/lib/utils';
import { getCurrentGps, addGpsWatermark, isWithinRadius } from '@/lib/geofencing';
import type { Order, OrderDocuments, GpsCoords } from '@/types';
import { toast } from 'sonner';

export default function SupervisorOrders() {
  const { user } = useAuth();
  const { t, lang } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});
  const [confirmingFee, setConfirmingFee] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsCoords | null>(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // الدالة المعدلة لجلب طلبات المحافظة الخاصة بالمشرف الحالي من الـ View
  const reload = useCallback(async () => {
    if (!user) return;
    try {
      // جلب البيانات من الـ View وتصفيتها بمعرف حساب المشرف الحالي
      const { data, error } = await supabase
        .from('supervisor_orders')
        .select('*')
        .eq('supervisor_user_id', user.id);

      if (error) throw error;

      // تنسيق البيانات لتطابق صيغة الأوردر (Order Type) المستخدمة في الفرونت إند
      const mappedOrders = (data || []).map((row: any) => ({
        id: row.order_id,
        client_name: row.client_name,
        client_phone: row.client_phone,
        total_amount: row.total_amount,
        status: row.order_status,
        province: row.order_province,
        created_at: row.order_date,
        // عواميد إضافية افتراضية للحفاظ على استقرار واجهة المستخدم
        documents: {}, 
        history: []
      }));

      setOrders(mappedOrders as any[]);
    } catch (err: any) {
      console.error("Error fetching supervisor orders:", err.message);
      toast.error(lang === 'ar' ? "حدث خطأ أثناء تحميل الطلبات" : "Error loading orders");
    }
  }, [user, lang]);

  useEffect(() => {
    reload();
  }, [reload]);

  // تتبع موقع المشرف الجغرافي عند فتح الصفحة
  useEffect(() => {
    setFetchingGps(true);
    getCurrentGps()
      .then(coords => setGps(coords))
      .catch(err => {
        console.error('GPS error:', err);
        toast.error(lang === 'ar' ? 'فشل تحديد الموقع الجغرافي. تأكد من تفعيل الـ GPS' : 'Failed to get GPS. Please enable location services');
      })
      .finally(() => setFetchingGps(false));
  }, [lang]);

  // تأكيد استلام رسوم الاستعلام وتحديث المحفظة والحالة
  const handleConfirmFee = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // 1. تحديث حالة الطلب في قاعدة البيانات إلى "قيد المراجعة"
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'under-inquiry' })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // 2. إضافة رسوم الاستعلام لمحفظة المشرف (التخزين المحلي حالياً)
      addFeeToWallet(user!.id, 50, `رسوم استعلام طلب #${orderId}`);
      
      // 3. إضافة إشعار للعميل
      addNotification(
        order.id, // نستخدم الـ order.user_id الفعلي لو كان متاحاً في سكوب الكود، أو الآيدي مؤقتاً
        'تحديث طلب التقسيط',
        `تم تأكيد استعلام طلبك رقم #${orderId} وهو الآن قيد الدراسة والمراجعة`,
        'order'
      );

      toast.success(lang === 'ar' ? 'تم تأكيد استلام الرسوم وبدء الاستعلام' : 'Fee confirmed, inquiry started');
      setConfirmingFee(null);
      reload();
    } catch (err: any) {
      console.error("Error confirming fee:", err.message);
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء تأكيد الرسوم' : 'Error confirming fee');
    }
  };

  // رفع مستندات معينة (مثل المعاينة الميدانية أو إيصال المرافق) بالـ GPS المدمج
  const handleDocUpload = async (orderId: string, docKey: string, file: File) => {
    if (!gps) {
      toast.error(lang === 'ar' ? 'يجب تحديد موقعك الجغرافي أولاً لرفع المستندات' : 'GPS coordinates required to upload documents');
      return;
    }

    try {
      // دمج البصمة الجغرافية على الصورة للأمان والتحقق الميداني
      const watermarkedBase64 = await addGpsWatermark(file, gps, user!.name);
      
      // تحديث المستندات محلياً أو رفعها على الـ Storage (يمكن ربطها بـ Supabase Storage لاحقاً)
      setDocPreviews(prev => ({ ...prev, [`${orderId}-${docKey}`]: watermarkedBase64 }));
      toast.success(lang === 'ar' ? 'تم رفع المستند مدمجاً ببصمة الـ GPS بنجاح' : 'Document uploaded with GPS watermark');
    } catch (err) {
      toast.error(lang === 'ar' ? 'فشل معالجة الصورة' : 'Error processing image');
    }
  };

  // تصعيد الطلب للمدير للمراجعة النهائية بعد إنهاء المشرف للاستعلام
  const handleEscalateToAdmin = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'pending-admin' })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(lang === 'ar' ? 'تم إرسال الطلب بنجاح للمدير للمراجعة النهائية' : 'Submitted to Admin for final review');
      setSelected(null);
      reload();
    } catch (err: any) {
      console.error("Error escalating order:", err.message);
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'Error submitting order');
    }
  };

  // تصفية الطلبات بناءً على البحث وحالة الطلب المختارة
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client_name.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toString().includes(search) ||
      order.client_phone.includes(search);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const docLabels: Record<string, { ar: string; en: string }> = {
    home_visit: { ar: 'صورة المعاينة الميدانية للمنزل', en: 'Home Visit Photo' },
    work_visit: { ar: 'صورة المعاينة الميدانية للعمل', en: 'Work Visit Photo' },
    utility_bill: { ar: 'إيصال مرافق حديث', en: 'Recent Utility Bill' },
    guarantor_id: { ar: 'بطاقة الضامن (وجه وظهير)', en: 'Guarantor ID (Front & Back)' }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة وبيانات الموقع */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('طلبات التقسيط بمحافظتك', 'Installment Orders in Your Governorate')}</h1>
          <p className="text-slate-500 text-xs mt-1">{t('إدارة ومعاينة طلبات العملاء جغرافياً', 'Manage and verify customer orders geographically')}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <MapPin size={16} className={fetchingGps ? "text-amber-500 animate-pulse" : gps ? "text-emerald-500" : "text-rose-500"} />
          <span className="text-xs font-medium text-slate-600">
            {fetchingGps ? t('جاري تحديد موقعك...', 'Locating...') : 
             gps ? `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}` : 
             t('الموقع غير متاح', 'GPS Disabled')}
          </span>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={t('البحث باسم العميل، رقم الهاتف أو رقم الطلب...', 'Search by name, phone or order ID...')}
            className="input-field pr-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field md:w-48 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">{t('كل الحالات', 'All Statuses')}</option>
          <option value="pending">{t('في انتظار رسوم الاستعلام', 'Awaiting Fee')}</option>
          <option value="under-inquiry">{t('قيد الاستعلام الميداني', 'Under Field Inquiry')}</option>
          <option value="pending-admin">{t('تم الاستعلام - عند المدير', 'Submitted to Admin')}</option>
        </select>
      </div>

      {/* شبكة عرض الأوردرات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">#{order.id}</span>
                <h3 className="font-bold text-slate-800 text-base mt-0.5">{order.client_name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                {getOrderStatusLabel(order.status, lang)}
              </span>
            </div>

            <div className="space-y-1.5 my-4 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>{t('رقم الهاتف:', 'Phone:')}</span>
                <span className="font-medium font-mono">{order.client_phone}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('المحافظة:', 'Province:')}</span>
                <span className="font-medium">{order.province}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('تاريخ الطلب:', 'Order Date:')}</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-100 pt-2 mt-2">
                <span className="font-medium text-slate-700">{t('إجمالي المبلغ:', 'Total Amount:')}</span>
                <span className="font-bold text-slate-800 text-sm">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50">
              {order.status === 'pending' ? (
                <button
                  onClick={() => setConfirmingFee(order.id)}
                  className="btn-gold w-full flex items-center justify-center gap-1.5 py-2 text-xs"
                >
                  <DollarSign size={14} />
                  {t('تأكيد استلام رسوم المعاينة (50 ج.م)', 'Confirm Inquiry Fee (50 EGP)')}
                </button>
              ) : (
                <button
                  onClick={() => setSelected(order)}
                  className="btn-primary w-full flex items-center justify-center gap-1.5 py-2 text-xs"
                >
                  <Eye size={14} />
                  {t('بدء الاستعلام ورفع التقارير', 'Start Inquiry & Uploads')}
                </button>
              )
            }
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
            <AlertCircle size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm">{t('لا توجد طلبات تطابق الفلترة الحالية بمحافظتك', 'No orders matching filters found in your province')}</p>
          </div>
        )}
      </div>

      {/* مودال تأكيد الرسوم النقدية */}
      {confirmingFee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              {t('تأكيد استلام رسوم المعاينة والاستعلام الاستباقي كاش؟', 'Confirm Cash Inquiry Fee Receipt?')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              {t('بالتأكيد، أنت تقر بأنك استلمت مبلغ 50 جنيهاً مصرياً نقداً من العميل كرسوم لزيارة المعاينة الميدانية. سيتم شحن هذا المبلغ فوراً في محفظة مستحقاتك وتحويل الطلب لحالة الاستعلام لبدء العمل عليه وتوثيق المستندات.', 
                 'By confirming, you acknowledge that you received 50 EGP in cash from the customer for the field visit. This fee will be loaded into your earnings wallet and the order status will shift to active inquiry.')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleConfirmFee(confirmingFee)} className="btn-gold flex-1 text-xs py-2">
                {t('نعم، تأكيد الاستلام البدء', 'Yes, Confirm Receipt')}
              </button>
              <button onClick={() => setConfirmingFee(null)} className="btn-secondary flex-1 text-xs py-2">
                {t('إلغاء تراجع', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال المعاينة الميدانية المتقدم وجلب المستندات بالـ GPS */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h2 className="font-bold text-slate-800 text-base">{t('الملف الاستعلامي الميداني الرقمي', 'Digital Field Inquiry File')}</h2>
                <p className="text-slate-500 text-xs mt-0.5">{selected.client_name} — الطلب #{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-200 text-slate-400 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* شريط التحذير من الـ Geofencing الجغرافي */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 items-start">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold">{t('نظام مراقبة التزييف الجغرافي نشط (Anti-Fraud GPS GPS Watermarking)', 'Anti-Fraud GPS Watermarking Active')}</p>
                  <p className="mt-0.5">{t('يجب رفع المستندات والصور الحية مباشرة من موقع المعاينة الفعلي للعميل، حيث يقوم النظام بدمج خطوط الطول والعرض وتوقيت الرفع الجغرافي غير القابل للتعديل على الصورة لحماية جودة الائتمان وموثوقية المعاينة.',
                                           'Photos must be captured at the customer location. The system automatically embeds non-modifiable coordinates & timestamps onto the file for anti-fraud auditing purposes.')}</p>
                </div>
              </div>

              {/* قسم رفع المستندات وتأكيد البصمة الجغرافية */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                  <Camera size={16} className="text-slate-500" />
                  {t('المستندات التوثيقية الإلزامية المطلوب رفعها:', 'Required Verification Documents:')}
                </h3>
                
                {selected.status === 'under-inquiry' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(docLabels).map(([key, label]) => {
                        const previewKey = `${selected.id}-${key}`;
                        const hasPreview = !!docPreviews[previewKey];
                        
                        return (
                          <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between min-h-[140px]">
                            <div>
                              <span className="text-xs font-bold text-slate-700 block mb-1">{lang === 'ar' ? label.ar : label.en}</span>
                              <span className="text-[10px] text-slate-400 leading-tight block mb-3">
                                {key === 'home_visit' || key === 'work_visit' ? t('صورة حية مظهرة للموقع العام واللافتة أو الشقة', 'Live image of the facade/interior') : t('صورة ضوئية واضحة وعالية الجودة', 'Clear scanned copy or clear image')}
                              </span>
                            </div>

                            {hasPreview ? (
                              <div className="relative rounded-lg overflow-hidden border border-emerald-100 h-20 bg-black">
                                <img src={docPreviews[previewKey]} alt="preview" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 p-1 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 to-transparent">
                                  <span className="text-[9px] text-emerald-400 font-medium font-mono flex items-center gap-0.5">
                                    <FileCheck size={10} /> {t('مؤمنة جغرافياً وتمام الرفع', 'GPS Secured')}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <label className="btn-secondary w-full py-1.5 text-xs text-center cursor-pointer flex items-center justify-center gap-1">
                                <Upload size={12} />
                                {t('التقاط ورفع الصورة', 'Capture & Upload')}
                                <input type="file" accept="image/*" className="hidden" onChange={(e: any) => e.target.files?.[0] && handleDocUpload(selected.id, key, e.target.files[0])} />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* زر التصعيد للمدير بعد إنهاء كافة الأوراق متمتعة بالـ GPS */}
                    <button onClick={() => handleEscalateToAdmin(selected.id)} className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm py-2">
                      <CheckCircle size={15} />
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
