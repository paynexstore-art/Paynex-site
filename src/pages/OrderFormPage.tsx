import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InstallmentCalculator from '@/components/features/InstallmentCalculator';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { addOrder, getSupervisorByProvince } from '@/lib/storage';
import { calculateInstallment } from '@/lib/installment';
import { formatCurrency } from '@/lib/utils';
import { PROVINCES } from '@/constants/data';
import type { Product, Order, InstallmentPlan } from '@/types';
import { toast } from 'sonner';

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Step = 'product' | 'plan' | 'info' | 'success';

export default function OrderFormPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const { t, lang } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<Step>('product');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

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

  // ✅ Load product from Supabase - same as ProductDetailPage
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoadingProduct(true);

        if (!productId) {
          console.warn('⚠️ No productId provided');
          setProduct(null);
          setLoadingProduct(false);
          return;
        }

        console.log(`🔄 OrderFormPage: Fetching product with ID: ${productId}`);

        // Fetch product by ID from Supabase
        const { data, error: queryError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (queryError) {
          if (queryError.code === 'PGRST116') {
            console.warn(`⚠️ Product not found for ID: ${productId}`);
            setProduct(null);
          } else {
            console.error('❌ Error fetching product from Supabase:', queryError);
            setProduct(null);
          }
          setLoadingProduct(false);
          return;
        }

        if (!data) {
          console.warn(`⚠️ No product data returned for ID: ${productId}`);
          setProduct(null);
          setLoadingProduct(false);
          return;
        }

        // Manual mapping from Supabase underscored columns to Product interface
        const mappedProduct: Product = {
          id: data.id || '',
          name: data.name_en || data.name_ar || '',
          nameAr: data.name_ar || data.name_en || '',
          nameEn: data.name_en || data.name_ar || '',
          description: data.description_en || data.description_ar || '',
          descriptionAr: data.description_ar || data.description_en || '',
          descriptionEn: data.description_en || data.description_ar || '',
          price: Number(data.price) || 0,
          originalPrice: data.original_price ? Number(data.original_price) : undefined,
          images: Array.isArray(data.image_url) ? data.image_url : [data.image_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop'],
          category: data.category_en || data.category || 'other',
          categoryAr: data.category_ar || data.category || 'أخرى',
          brand: data.brand || '',
          source: data.source || 'manual',
          sourceId: data.source_id,
          sourceUrl: data.source_url,
          isActive: data.is_active || false,
          stock: Number(data.stock) || 0,
          specs: data.specs && typeof data.specs === 'object' ? data.specs : {},
          lastSyncedAt: data.last_synced_at,
          createdAt: data.created_at || new Date().toISOString(),
          adminPriceOverride: data.admin_price_override ? Number(data.admin_price_override) : undefined,
        };

        console.log('✅ OrderFormPage: Product loaded:', mappedProduct.nameAr);
        setProduct(mappedProduct);
        
        // Update plan with actual product price
        setPlan(
          calculateInstallment({
            productPrice: mappedProduct.price,
            downPayment: Number(searchParams.get('down') ?? 0),
            months: Number(searchParams.get('months') ?? 12),
          })
        );
      } catch (err) {
        console.error('Error loading product:', err);
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    }

    fetchProduct();
  }, [productId, searchParams]);

  // Update user form data when user changes
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.name || f.name,
        email: user.email || f.email,
        phone: user.phone || f.phone,
      }));
    }
  }, [user]);

  // Validate personal info
  function validateInfo(): boolean {
    const errs: Record<string, string> = {};
    
    if (!form.name.trim()) {
      errs.name = t('الاسم مطلوب', 'Name is required');
    }
    
    if (!form.phone.match(/^01[0-9]{9}$/)) {
      errs.phone = t('رقم هاتف غير صحيح', 'Invalid phone number');
    }
    
    if (!form.nationalId.match(/^[0-9]{14}$/)) {
      errs.nationalId = t(
        'الرقم القومي يجب أن يكون 14 رقماً',
        'National ID must be 14 digits'
      );
    }
    
    if (!form.province) {
      errs.province = t('المحافظة مطلوبة', 'Province is required');
    }
    
    if (!form.address.trim()) {
      errs.address = t('العنوان مطلوب', 'Address is required');
    }
    
    if (!form.job.trim()) {
      errs.job = t('الوظيفة مطلوبة', 'Job is required');
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ✅ Submit order ONLY AFTER validation - saves to BOTH localStorage AND Supabase
  async function handleSubmitOrder(): Promise<void> {
    // Validate before submission
    if (!validateInfo()) {
      toast.error(t('يرجى ملء جميع البيانات بشكل صحيح', 'Please fill all fields correctly'));
      return;
    }

    if (!product) {
      toast.error(t('خطأ: المنتج غير موجود', 'Error: Product not found'));
      return;
    }

    if (!user) {
      toast.error(t('خطأ: يجب تسجيل الدخول أولاً', 'Error: Please log in first'));
      return;
    }

    try {
      setLoading(true);
      const supervisor = getSupervisorByProvince(form.province);

      const orderData = {
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

      // Calculate credit score
      const { calculateCreditScore } = await import('@/lib/creditScore');
      const creditScore = calculateCreditScore({
        ...orderData,
        id: '',
        createdAt: '',
        updatedAt: '',
      } as any);

      // ✅ Add order to localStorage first
      const order = addOrder({ ...orderData, creditScore });
      
      // ✅ Save order to Supabase for persistence - FIXED FIELDS TO PREVENT NULL
      try {
        const selectedProvinceLabel = provincesList.find(p => p.value === form.province)?.label || form.province;
        
        const { error: supabaseError } = await supabase
          .from('orders')
          .insert([{
            client_name: form.name,
            client_phone: form.phone,
            national_id: form.nationalId,
            total_amount: plan.totalAmount,
            status: 'pending',
            // الحقول المعدلة والمضافة لحل مشكلة الـ NULL وإظهارها للمشرفين بالعربية
            province: selectedProvinceLabel,
            address: `محافظه ${selectedProvinceLabel} - ${form.address}`
          }]);

        if (supabaseError) {
          console.error('Supabase order error:', supabaseError);
          // Don't fail - localStorage order was created
        } else {
          console.log('Order saved to Supabase successfully');
        }
      } catch (sbErr) {
        console.error('Failed to save order to Supabase:', sbErr);
      }
      
      // Update UI to success state
      setSubmittedOrder(order);
      setStep('success');
      
      toast.success(
        t('تم إرسال طلبك بنجاح!', 'Order submitted successfully!')
      );
    } catch (err) {
      console.error('Error submitting order:', err);
      toast.error(t('حدث خطأ أثناء إرسال الطلب', 'Error submitting order'));
    } finally {
      setLoading(false);
    }
  }

  const provincesList = PROVINCES.map((p) => ({
    value: p.id,
    label: lang === 'ar' ? p.nameAr : p.nameEn,
  }));

  // Loading state
  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-[#0f2460] animate-pulse">
              {t('جاري تحميل...', 'Loading...')}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error: Product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-card p-8 text-center max-w-md">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {t('المنتج غير موجود', 'Product Not Found')}
            </h2>
            <p className="text-slate-600 mb-6">
              {t(
                'عذراً، لم يتم العثور على المنتج المطلوب.',
                'Sorry, the product could not be found.'
              )}
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Progress Indicator - Hidden on success */}
        {step !== 'success' && (
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#0f2460] hover:text-[#0f2460]/80 font-medium text-sm"
            >
              <ArrowLeft size={16} />
              {t('رجوع', 'Back')}
            </button>
            
            <div className="flex items-center justify-center flex-1 gap-4">
              {[
                { key: 'product', label: t('المنتج', 'Product'), icon: '1' },
                { key: 'plan', label: t('الخطة', 'Plan'), icon: '2' },
                { key: 'info', label: t('البيانات', 'Info'), icon: '3' },
              ].map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div className="flex flex-col items-center">
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
                    <span className="text-xs mt-1 text-slate-600 font-medium whitespace-nowrap">
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="w-8 h-0.5 bg-slate-200 mx-2 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Product Selection */}
        {step === 'product' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-[#0f2460] mb-6 text-center">
              {t('الخطوة 1: تأكيد المنتج', 'Step 1: Confirm Product')}
            </h2>

            <div className="bg-white rounded-2xl border-2 border-[#0f2460] p-6 mb-8 shadow-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <h3 className="text-2xl font-bold text-[#0f2460] mb-3">
                    {lang === 'ar' ? product.nameAr : product.nameEn}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                    {lang === 'ar' ? product.descriptionAr : product.descriptionEn}
                  </p>

                  <div className="flex items-end gap-3 mb-6">
                    <div className="text-3xl font-black text-[#d4a339]">
                      {formatCurrency(product.price, lang)}
                    </div>
                    {product.originalPrice && (
                      <div className="text-slate-400 line-through">
                        {formatCurrency(product.originalPrice, lang)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      <span className="text-sm text-slate-600">
                        {t('في المخزون', 'In Stock')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      <span className="text-sm text-slate-600">
                        {t('ضمان الجودة', 'Quality')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('plan')}
              className="btn-gold w-full py-3 font-bold text-lg"
            >
              {t('التالي: اختر خطة التقسيط', 'Next: Choose Plan')}
            </button>
          </div>
        )}

        {/* STEP 2: Plan Selection */}
        {step === 'plan' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-[#0f2460] mb-6 text-center">
              {t('الخطوة 2: اختر خطة التقسيط', 'Step 2: Select Installment Plan')}
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex gap-4">
                <img
                  src={product.images[0]}
                  alt={product.nameAr}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <div className="font-bold text-[#0f2460]">
                    {lang === 'ar' ? product.nameAr : product.nameEn}
                  </div>
                  <div className="text-[#d4a339] font-bold">
                    {formatCurrency(product.price, lang)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
              <InstallmentCalculator
                productPrice={product.price}
                onPlanSelected={(p) => {
                  setPlan(p);
                }}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-yellow-800 text-sm font-medium">
              ⚠️{' '}
              {t(
                'تطبق رسوم استعلام تدفع عند توقيع طلب التقسيط ورفع المستندات',
                'Inquiry fee applies upon signing the installment agreement and document submission'
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('product')}
                className="btn-outline flex-1 py-3 font-bold"
              >
                {t('السابق', 'Previous')}
              </button>
              <button
                onClick={() => setStep('info')}
                className="btn-gold flex-1 py-3 font-bold"
              >
                {t('التالي: ملء البيانات', 'Next: Fill Form')}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Personal Information Form */}
        {step === 'info' && (
          <div ref={formRef} className="animate-fade-in">
            <h2 className="text-2xl font-bold text-[#0f2460] mb-6 text-center">
              {t('الخطوة 3: ملء البيانات', 'Step 3: Fill Your Information')}
            </h2>

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
                    {plan.months} {t('شهر', 'mo')} ×{' '}
                    {formatCurrency(plan.monthlyPayment, lang)}/{t('شهر', 'mo')}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    field: 'name',
                    label: t('الاسم الكامل', 'Full Name'),
                    type: 'text',
                    placeholder: t('أحمد محمد', 'Ahmed Mohamed'),
                  },
                  {
                    field: 'email',
                    label: t('البريد الإلكتروني', 'Email'),
                    type: 'email',
                    placeholder: 'example@email.com',
                  },
                  {
                    field: 'phone',
                    label: t('رقم الهاتف', 'Phone'),
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
                    label: t('الوظيفة', 'Job'),
                    type: 'text',
                    placeholder: t('مهندس...', 'Engineer...'),
                  },
                ].map(({ field, label, type, placeholder, maxLength }) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
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
                      <p className="text-red-500 text-xs mt-1">
                        {errors[field]}
                      </p>
                    )}
                  </div>
                ))}

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
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
                    <p className="text-red-500 text-xs mt-1">
                      {errors.province}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    {t('العنوان', 'Address')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder={t('الشارع، الحي...', 'Street, Area...')}
                    rows={3}
                    className={`input-field resize-none ${
                      errors.address ? 'border-red-400 bg-red-50' : ''
                    }`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('plan')}
                className="btn-outline flex-1 py-3 font-bold"
              >
                {t('السابق', 'Previous')}
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
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle size={56} className="text-green-500" />
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-[#0f2460] mb-2">
                {t(
                  'تم تقديم طلب التقسيط بنجاح!',
                  'Order Submitted Successfully!'
                )}
              </h1>

              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                {t(
                  'سيقوم أحد مشرفي باينكس بالتواصل معك في أقرب وقت لتأكيد الطلب.',
                  'One of our Paynex supervisors will contact you soon to confirm your order.'
                )}
              </p>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">
                  {t('رقم الطلب:', 'Order ID:')}
                </p>
                <p className="text-2xl font-black text-[#0f2460] font-mono">
                  {submittedOrder.id}
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 text-start">
                <h3 className="font-bold text-blue-900 mb-3">
                  ✓ {t('تفاصيل الطلب:', 'Order Details:')}
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>{t('المنتج:', 'Product:')}</span>
                    <span className="font-bold">
                      {lang === 'ar' ? product.nameAr : product.nameEn}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('السعر:', 'Price:')}</span>
                    <span className="font-bold text-[#d4a339]">
                      {formatCurrency(product.price, lang)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('الخطة:', 'Plan:')}</span>
                    <span className="font-bold">
                      {plan.months} {t('شهر', 'months')} ×{' '}
                      {formatCurrency(plan.monthlyPayment, lang)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary py-3 font-bold"
                >
                  {t('العودة للرئيسية', 'Go Home')}
                </button>
                <button
                  onClick={() => navigate(`/order-status/${submittedOrder.id}`)}
                  className="btn-outline py-3 font-bold"
                >
                  {t('تتبع الطلب', 'Track Order')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
