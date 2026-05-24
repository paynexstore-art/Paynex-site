import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Clock, CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InstallmentCalculator from '@/components/features/InstallmentCalculator';
import { useApp } from '@/contexts/AppContext';
import { getProducts } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import type { InstallmentPlan } from '@/lib/installment';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<ReturnType<typeof import('@/lib/installment').calculateInstallment> | null>(null);

  useEffect(() => {
    setLoading(true);
    const found = getProducts().find(p => p.id === id);
    if (!found) {
      setProduct(null);
    } else {
      setProduct(found);
    }
    setLoading(false);
  }, [id, navigate]);

  // حالة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-[#0f2460] animate-pulse">{t('جاري تحميل المنتج...', 'Loading product...')}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // حالة المنتج غير موجود
  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-card p-8 text-center max-w-md">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('المنتج غير موجود', 'Product Not Found')}</h2>
            <p className="text-slate-600 mb-6">{t('عذراً، المنتج الذي تبحث عنه غير متوفر أو تم حذفه.', 'Sorry, the product you are looking for is not available or has been deleted.')}</p>
            <div className="flex gap-3 flex-col">
              <button
                onClick={() => navigate('/products')}
                className="btn-primary w-full"
              >
                {t('العودة للمنتجات', 'Back to Products')}
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary w-full"
              >
                {t('الذهاب للرئيسية', 'Go to Home')}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const name = lang === 'ar' ? product.nameAr : product.nameEn;
  const desc = lang === 'ar' ? product.descriptionAr : product.descriptionEn;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-[#0f2460]">{t('الرئيسية', 'Home')}</button>
          <ChevronLeft size={14} className="rtl-flip" />
          <button onClick={() => navigate('/products')} className="hover:text-[#0f2460]">{t('المنتجات', 'Products')}</button>
          <ChevronLeft size={14} className="rtl-flip" />
          <span className="text-[#0f2460] font-medium truncate max-w-[200px]">{name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {/* Image Gallery */}
          <div>
            <div className="relative bg-white rounded-2xl shadow-card overflow-hidden aspect-square mb-4">
              <img
                src={product.images[imgIndex]}
                alt={name}
                className="w-full h-full object-cover"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex(i => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => setImgIndex(i => (i + 1) % product.images.length)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === imgIndex ? 'border-[#0f2460]' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="badge-navy mb-3 inline-block">{lang === 'ar' ? product.categoryAr : product.category}</div>
            <h1 className="text-2xl md:text-3xl font-black text-[#0f2460] mb-3">{name}</h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">{desc}</p>

            {/* Price */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card mb-6">
              <div className="flex items-end gap-3 mb-2">
                <div className="text-3xl font-black text-[#0f2460]">{formatCurrency(product.price, lang)}</div>
                {product.originalPrice && (
                  <div className="text-slate-400 line-through text-lg">{formatCurrency(product.originalPrice, lang)}</div>
                )}
              </div>
              {selectedPlan && (
                <div className="bg-[#0f2460]/5 rounded-xl p-3 text-sm text-[#0f2460]">
                  <strong>{t('الخطة المختارة:', 'Selected Plan:')}</strong>{' '}
                  {selectedPlan.months} {t('شهر', 'months')} ×{' '}
                  {formatCurrency(selectedPlan.monthlyPayment, lang)}/{t('شهر', 'mo')}
                </div>
              )}
            </div>

            {/* Order Button */}
            <button
              onClick={() => navigate(`/order/${product.id}${selectedPlan ? `?months=${selectedPlan.months}&down=${selectedPlan.downPayment}` : ''}`)}
              className="btn-gold w-full text-base mb-4 flex items-center justify-center gap-2"
            >
              {t('اطلب بالتقسيط الآن', 'Order in Installments Now')}
              <ArrowRight size={18} className="rtl-flip" />
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: <Shield size={18} />, label: t('بيانات آمنة', 'Secure') },
                { icon: <Clock size={18} />, label: t('موافقة سريعة', 'Fast Approval') },
                { icon: <CheckCircle size={18} />, label: t('ضمان الجودة', 'Quality') },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-slate-100 text-center">
                  <span className="text-[#d4a339]">{b.icon}</span>
                  <span className="text-xs text-slate-600 font-medium">{b.label}</span>
                </div>
              ))}
            </div>

            {/* Specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="bg-[#0f2460] px-4 py-3">
                  <h3 className="font-semibold text-white text-sm">{t('المواصفات', 'Specifications')}</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="flex px-4 py-2.5 text-sm">
                      <span className="text-slate-500 w-1/2">{key}</span>
                      <span className="font-medium text-slate-800 w-1/2">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calculator */}
        <div className="max-w-2xl mx-auto">
          <h2 className="section-title mb-6 text-center">{t('احسب قسطك', 'Calculate Your Installment')}</h2>
          <InstallmentCalculator
            productPrice={product.price}
            onPlanSelected={(plan) => {
              setSelectedPlan(plan);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
