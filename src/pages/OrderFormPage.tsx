import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InstallmentCalculator from '@/components/features/InstallmentCalculator';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, addOrder, getSupervisorByProvince } from '@/lib/storage';
import { calculateInstallment } from '@/lib/installment';
import { formatCurrency, generateId } from '@/lib/utils';
import { PROVINCES } from '@/constants/data';
import type { Product, Order, InstallmentPlan } from '@/types';
import { toast } from 'sonner';

type Step = 'product' | 'plan' | 'info' | 'success';

export default function OrderFormPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const { t, lang } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<Step>('product');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const [plan, setPlan] = useState<InstallmentPlan>(() =>
    calculateInstallment({
      productPrice: 0,
      downPayment: Number(searchParams.get('down') ?? 0),
      months: Number(searchParams.get('months') ?? 12),
    })
  );

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    nationalId: '',
    province: '',
    address: '',
    job: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // تحميل المنتج
  useEffect(() => {
    const p = getProducts().find(pr => pr.id === productId);
    if (!p) {
      navigate('/products');
      return;
    }
    setProduct(p);
    setPlan(calculateInstallment({
      productPrice: p.price,
      downPayment: Number(searchParams.get('down') ?? 0),
      months: Number(searchParams.get('months') ?? 12),
    }));
  }, [productId, navigate, searchParams]);

  // تحديث بيانات المستخدم
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || f.name,
        email: user.email || f.email,
        phone: user.phone || f.phone,
      }));
    }
  }, [user]);

  // التحقق من صحة البيانات الشخصية
  function validateInfo() {
    const errs: Record<string, string> = {};
    if (!form.name.trim())
      errs.name = t('الاسم مطلوب', 'Name is required');
    if (!form.phone.match(/^01[0-9]{9}$/))
      errs.phone = t('رقم هاتف غير صحيح', 'Invalid phone number');
    if (!form.nationalId.match(/^[0-9]{14}$/))
      errs.nationalId = t('الرقم القومي يجب أن يكون 14 رقماً', 'National ID must be 14 digits');
    if (!form.province)
      errs.province = t('المحافظة مطلوبة', 'Province is required');
    if (!form.address.trim())
      errs.address = t('العنوان مطلوب', 'Address is required');
    if (!form.job.trim())
      errs.job = t('الوظيفة مطلوبة', 'Job is required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // إرسال الطلب
  async function handleSubmitOrder() {
    if (!product || !user) {
      toast.error(t('خطأ: المنتج أو المستخدم غير موجود', 'Error: Product or user not found'));
      return;
    }

    if (!validateInfo()) {
      toast.error(t('يرجى ملء جميع البيانات بشكل صحيح', 'Please fill all fields correctly'));
      return;
    }

    try {
      setLoading(true);
      const supervisor = getSupervisorByProvince(form.province);

      const orderBase = {
        customerId: user.id,
        customerName: form.name,
        customerPhone: form.phone,
        customerNationalId: form.nationalId,
        customerEmail: form.email,
        customerProvince: form.province,
        customerAddress: form.address,
        customerJob: form.job,
        productId: product.id,
        product,
        installmentPlan: plan,
        status: 'pending' as const,
        supervisorId: supervisor?.id,
        documents: {},
      };

      // Auto-compute credit score for admin view
      const { calculateCreditScore } = await import('@/lib/creditScore');
      const creditScore = calculateCreditScore({
        ...orderBase,
        id: '',
        createdAt: '',
        updatedAt: '',
      } as any);

      const order = addOrder({ ...orderBase, creditScore });
      setSubmittedOrder(order);
      setStep('success');
      
      // عدم الانتقال التلقائي، والبقاء على صفحة النجاح
      toast.success(t('تم إرسال طلبك بنجاح!', 'Order submitted successfully!'));
    } catch (err) {
      console.error('Error submitting order:', err);
      toast.error(t('حدث خطأ أثناء إرسال الطلب', 'Error submitting order'));
    } finally {
      setLoading(false);
    }
  }

  // إذا كان هناك خطأ في تحميل المنتج
  if (!product && step !== 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-card p-8 text-center max-w-md">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {t('خطأ', 'Error')}
            </h2>
            <p className="text-slate-600 mb-6">
              {t('لم يتم العثور على المنتج', 'Product not found')}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="btn-primary w-full"
            >
              {t('العودة للمنتجات', 'Back to Products')}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const provincesList = PROVINCES.map(p => ({
    value: p.id,
    label: lang === 'ar' ? p.nameAr : p.nameEn,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Progress Indicator - Hidden on success */}
        {step !== 'success' && (
          <div className="flex items-center justify-center mb-8">
            {[
              { key: 'product', label: t('المنتج', 'Product'), icon: '1' },
              { key: 'plan', label: t('الخطة', 'Plan'), icon: '2' },
              { key: 'info', label: t('البيانات', 'Info'), icon: '3' },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`flex flex-col items-center ${i > 0 ? 'ms-4' : ''}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      ['product', 'plan', 'info'].indexOf(step) >= i
                        ? 'bg-[#0f2460] text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {['product', 'plan', 'info'].indexOf(step) > i ? (
                      <CheckCircle size={20} />
                    ) : (
                      s.icon
                    )}
                  </div>
                  <span className="text-xs mt-1 text-slate-600 font-medium">{s.label}</span>
                </div>
                {i < 2 && <div className="w-16 h-0.5 bg-slate-200 mb-4 mx-2" />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Product Selection */}
        {step === 'product' && product && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-[#0f2460] mb-6 text-center">
              {t('الخطوة 1: اختر المنتج', 'Step 1: Select Product')}
            </h2>

            {/* Product Summary Card */}
            <div className="bg-white rounded-2xl border-2 border-[#0f2460] p-6 mb-6 shadow-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-1">
                  <img
                    src={product.images[0]}
                    alt={product.nameAr}
                    className="w-full h-48 rounded-xl object-cover"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="badge-navy mb-3 inline-block">
                    {lang === 'ar' ? product.categoryAr : product.category}
                  </div>
                  <h3 className="text-2xl font-bold text-[#0f2460] mb-2">
                    {lang === 'ar' ? product.nameAr : product.nameEn}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                    {lang === 'ar'
                      ? product.descriptionAr
                      : product.descriptionEn}
                  </p>

                  {/* Price */}
                  <div className="flex items-end gap-3 mb-4">
                    <div className="text-3xl font-black text-[#d4a339]">
                      {formatCurrency(product.price, lang)}
                    </div>
                    {product.originalPrice && (
                      <div className="text-slate-400 line-through text-lg">
                        {formatCurrency(product.originalPrice, lang)}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-slate-600">
                        {t('في المخزون', 'In Stock')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-slate-600">
                        {t('ضمان الجودة', 'Quality Guaranteed')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => setStep('plan')}
              className="btn-gold w-full text-lg font-bold py-3"
            >
              {t('التالي: اختر خطة التقسيط', 'Next: Select Installment Plan')}
            </button>
          </div>
        )}

        {/* STEP 2: Plan Selection */}
        {step === 'plan' && product && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-[#0f2460] mb-6 text-center">
              {t('الخطوة 2: اختر خطة التقسيط', 'Step 2: Select Installment Plan')}
            </h2>

            {/* Product Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex gap-4">
                <img
                  src={product.images[0]}
                  alt={product.nameAr}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="font-bold text-[#0f2460]">
                    {lang === 'ar' ? product.nameAr : product.nameEn}
                  </div>
                  <div className="text-[#d4a339] font-bold">
                    {formatCurrency(product.price, lang)}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculator */}
            <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
              <InstallmentCalculator
                productPrice={product.price}
                onPlanSelected={(p) => {
                  setPlan(p);
                }}
              />
            </div>

            {/* Inquiry Fee Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-yellow-800 text-sm font-medium">
              ⚠️{' '}
              {t(
                `تطبق رسوم استعلام تدفع عند توقيع طلب التقسيط — قيمتها: ${formatCurrency(plan.inquiryFee || 150, 'ar')}`,
                `Inquiry fees of ${formatCurrency(plan.inquiryFee || 150, 'en')} apply when signing the installment application`
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('product')}
                className="btn-outline flex-1 py-3 font-bold"
              >
                {t('العودة', 'Back')}
              </button>
              <button
                onClick={() => setStep('info')}
                className="btn-gold flex-1 py-3 font-bold"
              >
                {t('التالي: ملء البيانات', 'Next: Fill Information')}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Personal Information Form */}
        {step === 'info' && product && (
          <div ref={formRef} className="animate-fade-in">
            <h2 className="text-xl font-bold text-[#0f2460] mb-6 text-center">
              {t('الخطوة 3: ملء البيانات الشخصية', 'Step 3: Personal Information')}
            </h2>

            {/* Product Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex gap-4">
                <img
                  src={product.images[0]}
                  alt={product.nameAr}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="font-bold text-[#0f2460]">
                    {lang === 'ar' ? product.nameAr : product.nameEn}
                  </div>
                  <div className="text-[#d4a339] font-bold">
                    {formatCurrency(product.price, lang)}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {plan.months} {t('شهر', 'mo')} × {formatCurrency(plan.monthlyPayment, lang)}/
                    {t('شهر', 'mo')}
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    field: 'name',
                    label: t('الاسم الكامل', 'Full Name'),
                    type: 'text',
                    placeholder: t('أحمد محمد علي', 'Ahmed Mohamed Ali'),
                  },
                  {
                    field: 'email',
                    label: t('البريد الإلكتروني', 'Email'),
                    type: 'email',
                    placeholder: 'example@email.com',
                  },
                  {
                    field: 'phone',
                    label: t('رقم الهاتف', 'Phone Number'),
                    type: 'tel',
                    placeholder: '01xxxxxxxxx',
                  },
                  {
                    field: 'nationalId',
                    label: t('الرقم القومي', 'National ID'),
                    type: 'text',
                    placeholder: '14 رقم',
                    maxLength: 14,
                  },
                  {
                    field: 'job',
                    label: t('الوظيفة', 'Job Title'),
                    type: 'text',
                    placeholder: t('مهندس، محاسب...', 'Engineer, Accountant...'),
                  },
                ].map(({ field, label, type, placeholder, maxLength }) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      {label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={type}
                      value={(form as any)[field]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [field]: e.target.value }))
                      }
                      placeholder={placeholder}
                      maxLength={maxLength}
                      className={`input-field ${
                        errors[field] ? 'border-red-400 bg-red-50' : ''
                      }`}
                    />
                    {errors[field] && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors[field]}
                      </p>
                    )}
                  </div>
                ))}

                {/* Province Select */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    {t('المحافظة', 'Province')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.province}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, province: e.target.value }))
                    }
                    className={`input-field ${
                      errors.province ? 'border-red-400 bg-red-50' : ''
                    }`}
                  >
                    <option value="">
                      {t('اختر المحافظة', 'Select Province')}
                    </option>
                    {provincesList.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {errors.province && (
                    <p className="text-red-500 text-xs mt-1">{errors.province}</p>
                  )}
                </div>

                {/* Address - Full Width */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    {t('العنوان بالتفصيل', 'Detailed Address')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder={t(
                      'الشارع، الحي، المنطقة...',
                      'Street, Neighborhood, Area...'
                    )}
                    rows={3}
                    className={`input-field resize-none ${
                      errors.address ? 'border-red-400 bg-red-50' : ''
                    }`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons - في الأسفل تماماً */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('plan')}
                className="btn-outline flex-1 py-3 font-bold"
              >
                {t('العودة', 'Back')}
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="btn-gold flex-1 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? t('جاري الإرسال...', 'Submitting...')
                  : t('تقديم الطلب', 'Submit Order')}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && submittedOrder && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl shadow-card p-8 md:p-12 text-center">
              {/* Success Icon */}
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle size={56} className="text-green-500" />
              </div>

              {/* Main Message */}
              <h1 className="text-3xl md:text-4xl font-black text-[#0f2460] mb-4">
                {t(
                  'تم تقديم طلب التقسيط بنجاح!',
                  'Installment Order Submitted Successfully!'
                )}
              </h1>

              {/* Order ID */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">
                  {t('رقم الطلب:', 'Order ID:')}
                </p>
                <p className="text-2xl font-black text-[#0f2460] font-mono">
                  {submittedOrder.id}
                </p>
              </div>

              {/* Confirmation Message */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 text-start">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <CheckCircle size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg mb-2">
                      {t('ماذا بعد الآن؟', 'What Now?')}
                    </h3>
                    <p className="text-blue-800 font-medium leading-relaxed">
                      {t(
                        'سيقوم أحد مشرفي باينكس بالتواصل معك في أقرب وقت لتأكيد الطلب والموافقة عليه. تأكد من أن رقم الهاتف المسجل صحيح.',
                        'One of our Paynex supervisors will contact you soon to confirm and approve your order. Please make sure your phone number is correct.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8 text-start">
                <h3 className="font-bold text-yellow-900 mb-3">
                  📋 {t('خطواتك القادمة:', 'Next Steps:')}
                </h3>
                <ol className="space-y-2 text-sm text-yellow-800">
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-900">1.</span>
                    <span>
                      {t(
                        'سيتصل بك المشرف خلال 24-48 ساعة',
                        'Supervisor will call you within 24-48 hours'
                      )}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-900">2.</span>
                    <span>
                      {t(
                        'تأكيد البيانات والمستندات المطلوبة',
                        'Confirm your information and required documents'
                      )}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-900">3.</span>
                    <span>
                      {t(
                        'دفع رسوم الاستعلام (اختياري)',
                        'Pay inquiry fees (optional)'
                      )}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-900">4.</span>
                    <span>
                      {t(
                        'الحصول على الموافقة النهائية والمنتج',
                        'Get final approval and receive your product'
                      )}
                    </span>
                  </li>
                </ol>
              </div>

              {/* Product Summary */}
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200 text-start">
                <h3 className="font-bold text-slate-900 mb-4">
                  {t('ملخص الطلب:', 'Order Summary:')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      {t('المنتج:', 'Product:')}
                    </span>
                    <span className="font-bold text-slate-900">
                      {lang === 'ar'
                        ? product?.nameAr
                        : product?.nameEn}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      {t('السعر:', 'Price:')}
                    </span>
                    <span className="font-bold text-[#d4a339]">
                      {formatCurrency(product?.price || 0, lang)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      {t('خطة التقسيط:', 'Installment Plan:')}
                    </span>
                    <span className="font-bold text-slate-900">
                      {plan.months} {t('شهر', 'months')} × {formatCurrency(plan.monthlyPayment, lang)}/{t('شهر', 'mo')}
                    </span>
                  </div>
                  {plan.inquiryFee && (
                    <div className="flex justify-between pt-2 border-t border-slate-300">
                      <span className="text-slate-600">
                        {t('رسوم الاستعلام:', 'Inquiry Fee:')}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(plan.inquiryFee, lang)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(`/order-status/${submittedOrder.id}`)}
                  className="btn-primary py-3 font-bold"
                >
                  {t('تتبع الطلب', 'Track Order')}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="btn-outline py-3 font-bold"
                >
                  {t('العودة للرئيسية', 'Go to Home')}
                </button>
              </div>

              {/* Support Note */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  {t(
                    'هل تواجه مشكلة؟ تواصل مع فريق الدعم الخاص بنا',
                    'Having issues? Contact our support team'
                  )}
                  <br />
                  📞 <strong>+20 123 456 7890</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
