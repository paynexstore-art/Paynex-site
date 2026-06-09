import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  Shield, Zap, CreditCard, Star,
  CheckCircle, TrendingUp, MapPin, Calculator, Sparkles
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/features/ProductCard';
import InstallmentCalculator from '@/components/features/InstallmentCalculator';
import PWAInstallBanner from '@/components/features/PWAInstallBanner';
import { useApp } from '@/contexts/AppContext';
import { PRODUCT_CATEGORIES } from '@/constants/categories';
import type { Product } from '@/types';
import paynexHero from '@/assets/paynex-hero.jpg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TESTIMONIALS = [
  { name: 'أحمد محمد', province: 'القاهرة', text: 'خدمة رائعة! حصلت على موبايلي بقسط شهري بسيط وبدون أي مشاكل. تجربة ممتازة.' },
  { name: 'سارة علي', province: 'الجيزة', text: 'المشرف كان محترماً جداً وإجراءات سريعة. باينكس غيرت فكرتي عن التقسيط تماماً.' },
  { name: 'محمود حسن', province: 'الإسكندرية', text: 'أفضل خدمة تقسيط في مصر. أسعار مناسبة وخدمة عملاء استثنائية.' },
  { name: 'فاطمة إبراهيم', province: 'الشرقية', text: 'كنت محتاجة لابتوب للشغل وباينكس حلت مشكلتي في أسرع وقت ممكن.' },
  { name: 'عمر خالد', province: 'الإسماعيلية', text: 'اشتريت تليفزيون كبير وقسطته على 24 شهر، الدفعة الشهرية خفيفة جداً على الميزانية.' },
  { name: 'منى سعيد', province: 'المنيا', text: 'تعامل راقي من المشرف وسرعة في إتمام الطلب. نصحت كل أصحابي بباينكس.' },
  { name: 'كريم رمضان', province: 'أسيوط', text: 'بدون فوائد حقيقي! حصلت على PS5 بسهولة تامة. الكلام ده صحيح فعلاً.' },
  { name: 'هدى عبد الله', province: 'قنا', text: 'خدمة عملاء ممتازة والمشرف رد في أقل من ساعة على جميع استفساراتي.' },
  { name: 'أيمن طه', province: 'سوهاج', text: 'الموقع سهل جداً وواضح. قدمت الطلب واتقبل في نفس اليوم تقريباً.' },
  { name: 'نهاد مصطفى', province: 'بني سويف', text: 'اشتريت غسالة جديدة لبيتي بدون أي ضغط مالي. شكراً باينكس على الخدمة الرائعة.' },
  { name: 'محمد عبدالعزيز', province: 'القاهرة', text: 'تجربة ممتازة وموثوقة. باينكس فعلاً حلت لي مشكلة التقسيط البنكي المعقد.' },
  { name: 'ليلى سامي', province: 'الجيزة', text: 'الموافقة سريعة والمشرف محترم. أنصح أي حد يفكر يقسط من باينكس.' },
  { name: 'خالد محمود', province: 'الإسكندرية', text: 'سعر المنتج نفس السوق والقسط مناسب. ما فيش زيادة خفية ولا رسوم غير متوقعة.' },
  { name: 'نورهان أحمد', province: 'الدقهلية', text: 'أول مرة أقسط online وكانت تجربة رائعة. شكراً لفريق باينكس على التواصل المستمر.' },
  { name: 'عبدالرحمن علي', province: 'القليوبية', text: 'التوصيل سريع والمشرف جاب كل المستندات المطلوبة. 10/10 للخدمة.' },
  { name: 'سامية فؤاد', province: 'الفيوم', text: 'قسطت تليفزيون لمطبخي. القسط الشهري أقل من فاتورة النت! شكراً باينكس.' },
  { name: 'مصطفى إبراهيم', province: 'كفر الشيخ', text: 'التعامل شفاف والمشرف واضح في كل خطوة. باينكس اسمها على مسمى.' },
  { name: 'ريم حسام', province: 'دمياط', text: 'المنتج وصلني سليم ومغلف بعناية. تجربة تقسيط ناجحة بكل المقاييس.' },
  { name: 'ياسر محسن', province: 'بور سعيد', text: 'الحاسبة التفاعلية ساعدتني أختار أفضل خطة. باينكس فعلاً ذكية.' },
  { name: 'هاجر سيد', province: 'السويس', text: 'خدمة ما بعد البيع ممتازة. لما واجهت مشكلة في الجهاز، ردوا عليّ فوراً.' },
];

const BRANDS = [
  'Samsung', 'Apple', 'LG', 'Sony', 'Lenovo', 'HP', 'Dell',
  'Huawei', 'Xiaomi', 'ASUS', 'Toshiba', 'Sharp', 'Hisense',
];

export default function HomePage() {
  const { t, settings } = useApp();
  const navigate = useNavigate();
  const [bannerIndex, setBannerIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Map<string, Product[]>>(new Map());
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);
  const countersTriggered = useRef(false);

  useEffect(() => {
    async function fetchTotalProductCount() {
      try {
        const { count, error: countError } = await supabase.from('products').select('id', { count: 'exact', head: true });
        if (countError) { setTotalProductCount(0); } else { setTotalProductCount(count || 0); }
      } catch { setTotalProductCount(0); }
    }
    fetchTotalProductCount();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from('products').select('*').eq('is_active', true)
          .order('created_at', { ascending: false }).limit(100);
        if (queryError || !data || data.length === 0) { setProducts([]); setProductsByCategory(new Map()); setLoading(false); return; }
        const mappedProducts: Product[] = (data as Record<string, unknown>[]).map((item) => ({
          id: item.id || '',
          name: item.name_en || item.name_ar || '',
          nameAr: item.name_ar || item.name_en || '',
          nameEn: item.name_en || item.name_ar || '',
          description: item.description_en || item.description_ar || '',
          descriptionAr: item.description_ar || item.description_en || '',
          descriptionEn: item.description_en || item.description_ar || '',
          price: Number(item.price) || 0,
          originalPrice: item.original_price ? Number(item.original_price) : undefined,
          images: Array.isArray(item.image_url) ? item.image_url : [item.image_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop'],
          category: item.category_en || item.category || 'other',
          categoryAr: item.category_ar || item.category || 'أخرى',
          brand: item.brand || '',
          source: item.source || 'manual',
          sourceId: item.source_id,
          sourceUrl: item.source_url,
          isActive: item.is_active || false,
          stock: Number(item.stock) || 0,
          specs: item.specs && typeof item.specs === 'object' ? item.specs : {},
          lastSyncedAt: item.last_synced_at,
          createdAt: item.created_at || new Date().toISOString(),
          adminPriceOverride: item.admin_price_override ? Number(item.admin_price_override) : undefined,
        }));
        const grouped = new Map<string, Product[]>();
        mappedProducts.forEach(p => { if (!grouped.has(p.category)) grouped.set(p.category, []); grouped.get(p.category)!.push(p); });
        setProducts(mappedProducts);
        setProductsByCategory(grouped);
      } catch { setProducts([]); setProductsByCategory(new Map()); }
      finally { setLoading(false); }
    }
    fetchProducts();
  }, []);

  const activeBannerCount = (settings?.banners ?? []).filter(b => b?.isActive).length || 1;
  useEffect(() => { const interval = setInterval(() => setBannerIndex(i => (i + 1) % activeBannerCount), 5000); return () => clearInterval(interval); }, [activeBannerCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !countersTriggered.current) {
        countersTriggered.current = true;
        animateCounter(setCount1, 1000000, 2200);
        animateCounter(setCount2, totalProductCount > 0 ? totalProductCount : products.length, 2200);
      }
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [totalProductCount, products.length]);

  function animateCounter(setter: (v: number) => void, target: number, duration: number) {
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setter(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const activeBanners = (settings?.banners ?? []).filter(b => b?.isActive);
  const currentBanner = activeBanners[bannerIndex] ?? activeBanners[0];

  const features = [
    { icon: CreditCard, titleAr: 'أقساط من 0 مقدم', titleEn: 'Zero Down Payment', descAr: 'لا مقدم ولا فوائد خفية', descEn: 'No down payment, no hidden interest' },
    { icon: Zap, titleAr: 'موافقة سريعة', titleEn: 'Fast Approval', descAr: 'قرار خلال ساعات قليلة', descEn: 'Decision within hours' },
    { icon: Shield, titleAr: 'بيانات آمنة', titleEn: 'Secure Data', descAr: 'تشفير AES-256 كامل', descEn: 'Full AES-256 encryption' },
    { icon: MapPin, titleAr: 'مشرفون محليون', titleEn: 'Local Supervisors', descAr: 'خدمة ميدانية في 27 محافظة', descEn: 'Field service across 27 provinces' },
  ];

  const steps = [
    { num: '01', titleAr: 'اختر منتجك', titleEn: 'Choose Product', descAr: 'تصفح مئات المنتجات من أفضل الماركات', descEn: 'Browse hundreds of products' },
    { num: '02', titleAr: 'احسب قسطك', titleEn: 'Calculate Installment', descAr: 'استخدم الحاسبة التفاعلية', descEn: 'Use our interactive calculator' },
    { num: '03', titleAr: 'قدم طلبك', titleEn: 'Submit Request', descAr: 'أكمل نموذج الطلب بخطوات بسيطة', descEn: 'Fill in your details in simple steps' },
    { num: '04', titleAr: 'استلم منتجك', titleEn: 'Receive Product', descAr: 'بعد الموافقة يصلك المشرف في موعدك', descEn: 'Supervisor delivers at your convenience' },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />
      <PWAInstallBanner />

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-[92vh] overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img src={currentBanner?.imageUrl ?? paynexHero} alt="PayNex باينكس" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#0a1628]/80 backdrop-blur-[2px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #00d4ff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur">
              <Sparkles size={12} />
              {t('التقسيط الذكي في مصر', 'Smart Installments in Egypt')}
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              {t('اشتري الآن', 'Buy Now')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#c9a84c]">
                {t('ادفع بالأقساط', 'Pay in Installments')}
              </span>
            </h1>

            <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-10 max-w-lg font-light">
              {t('حلول تقسيط ذكية على أحدث الإلكترونيات بدون فوائد خفية. أكثر من ألف منتج في انتظارك.', 'Smart installment solutions on the latest electronics with zero hidden interest. 1000+ products waiting for you.')}
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              {[
                t('✓ بدون فوائد', '✓ Zero Interest'),
                t('✓ من 0 مقدم', '✓ 0 Down Payment'),
                t('✓ موافقة سريعة', '✓ Fast Approval'),
              ].map(item => (
                <span key={item} className="bg-white/5 backdrop-blur border border-white/10 text-white/80 text-xs font-medium px-4 py-2 rounded-full">
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button onClick={() => document.getElementById('all-products')?.scrollIntoView({ behavior: 'smooth' })} className="btn-cyan text-base px-8 py-4 text-[#0a1628] font-black shadow-[0_4px_30px_rgba(0,212,255,0.35)] hover:shadow-[0_8px_40px_rgba(0,212,255,0.55)] transition-all">
                {t('تصفح المنتجات', 'Browse Products')}
              </button>
              <button onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/20 text-white/90 font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-all">
                <Calculator size={18} />
                {t('احسب قسطك', 'Calculate Now')}
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 end-6 hidden lg:block">
          <div className="calc-glass rounded-2xl p-5 text-white w-56 border border-white/10">
            <div className="text-[10px] text-white/40 mb-1 uppercase tracking-widest">{t('مثال — آيفون 15 برو', 'Example — iPhone 15 Pro')}</div>
            <div className="text-2xl font-black text-[#00d4ff]">{t('3,850 ج.م / شهر', 'EGP 3,850/mo')}</div>
            <div className="text-[10px] text-white/40 mt-1">{t('على 12 شهر — بدون فوائد', '12 months — zero interest')}</div>
          </div>
        </div>

        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {activeBanners.map((_, i) => (
              <button key={i} onClick={() => setBannerIndex(i)} className={`h-1.5 rounded-full transition-all ${i === bannerIndex ? 'bg-[#00d4ff] w-8' : 'bg-white/20 w-3'}`} />
            ))}
          </div>
        )}
      </section>

      {/* ══════════ STATS ══════════ */}
      <section ref={statsRef} className="bg-[#0a1628] py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: count1 >= 1000000 ? '+1M' : `+${count1.toLocaleString('ar-EG')}`, label: t('عميل سعيد', 'Happy Customers'), color: 'text-[#00d4ff]' },
              { value: count2 >= 1000 ? `+${(count2 / 1000).toFixed(0)}K` : `+${count2}`, label: t('منتج متاح', 'Available Products'), color: 'text-[#c9a84c]' },
              { value: '27', label: t('محافظة مغطاة', 'Provinces Covered'), color: 'text-[#00d4ff]' },
              { value: '0%', label: t('فوائد', 'Interest Rate'), color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="group">
                <div className={`text-3xl md:text-4xl font-black mb-1 ${s.color}`}>{s.value}</div>
                <div className="text-white/40 text-xs font-medium tracking-wide uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CATEGORIES — Glass Cards ══════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-[#0a1628] mb-3">{t('تصفح حسب الفئة', 'Browse by Category')}</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">{t('اكتشف مجموعة واسعة من المنتجات في كل فئة، بأقساط تبدأ من صفر مقدم', 'Discover a wide range of products in every category, with installments starting from zero down payment')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/products?category=${cat.id}`)}
                className="group relative p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(10,22,40,0.04)] hover:shadow-[0_8px_28px_rgba(10,22,40,0.10)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                  {cat.icon}
                </div>
                <span className="text-sm font-bold text-[#0a1628] block">{t(cat.nameAr, cat.nameEn)}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">{t('تصفح الآن', 'Browse now')}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WHY PAYNEX — Minimalist Cards ══════════ */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">{t('لماذا باينكس؟', 'Why PayNex?')}</div>
              <h2 className="text-4xl font-black text-[#0a1628] leading-tight mb-5">
                {t('التمويل الذكي', 'Smart Financing')}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0a1628] to-[#00d4ff]">{t('للجيل القادم', 'For the Next Generation')}</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-10 text-sm max-w-md">
                {t('باينكس ليست مجرد تقسيط — هي منظومة مالية ذكية مصممة لتبسيط تجربتك وتحقيق أحلامك بأقل جهد.', 'PayNex is not just installments — it is a smart financial ecosystem designed to simplify your experience and achieve your dreams with minimal effort.')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#00d4ff]/20 hover:shadow-[0_4px_16px_rgba(0,212,255,0.06)] transition-all duration-300">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color} shadow-sm`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-[#0a1628] text-sm">{t(f.titleAr, f.titleEn)}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{t(f.descAr, f.descEn)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#00d4ff]/20 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#0a1628] text-[#00d4ff] flex items-center justify-center font-black text-lg flex-shrink-0 group-hover:bg-[#00d4ff] group-hover:text-[#0a1628] transition-colors duration-300">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#0a1628] text-sm mb-0.5">{t(step.titleAr, step.titleEn)}</div>
                    <div className="text-slate-400 text-xs">{t(step.descAr, step.descEn)}</div>
                  </div>
                  <CheckCircle size={18} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PRODUCTS ══════════ */}
      <section id="all-products" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <div className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">{t('المتجر', 'Store')}</div>
            <h2 className="text-3xl md:text-4xl font-black text-[#0a1628] mb-2">{t('أحدث الإلكترونيات المتاحة', 'Latest Available Electronics')}</h2>
            <p className="text-slate-400 text-sm">{t(`أكثر من ${totalProductCount > 0 ? totalProductCount.toLocaleString('ar-EG') : products.length} منتج بأقساط ميسرة`, `${totalProductCount > 0 ? totalProductCount.toLocaleString() : products.length} products with easy installments`)}</p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <p className="text-2xl font-bold text-slate-200">{t('جاري تحميل المنتجات...', 'Loading products...')}</p>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl font-bold text-slate-200">{t('لا توجد منتجات متاحة', 'No products available')}</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="space-y-16">
              {PRODUCT_CATEGORIES.map(category => {
                const categoryProducts = productsByCategory.get(category.id) || [];
                if (categoryProducts.length === 0) return null;
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h3 className="text-xl font-black text-[#0a1628]">{t(category.nameAr, category.nameEn)}</h3>
                        <p className="text-xs text-slate-400">{t(`${categoryProducts.length} منتج`, `${categoryProducts.length} products`)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {categoryProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ CALCULATOR — Glass ══════════ */}
      <section id="calculator" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-paynex" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #00d4ff 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00d4ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] text-xs font-medium px-4 py-2 rounded-full mb-4">
              <Calculator size={14} />
              {t('حاسبة التقسيط التفاعلية', 'Interactive Calculator')}
            </div>
            <h2 className="text-4xl font-black text-white mb-3">{t('احسب قسطك الشهري', 'Calculate Your Monthly Payment')}</h2>
            <p className="text-white/50 text-sm">{t('أدخل السعر والمدة واحصل على النتيجة فوراً', 'Enter price and duration and get instant results')}</p>
          </div>
          <div className="calc-glass rounded-3xl p-6 md:p-8 border border-white/10">
            <InstallmentCalculator productPrice={20000} />
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="py-16 bg-[#0a1628] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
          <div className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">{t('آراء العملاء', 'Customer Reviews')}</div>
          <h2 className="text-3xl font-bold text-white">{t('مليون+ عميل يثق في باينكس', '1M+ Customers Trust PayNex')}</h2>
        </div>
        <div className="mb-4 overflow-hidden">
          <div className="flex gap-4 animate-marquee-rtl" style={{ width: 'max-content' }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((r, i) => (
              <div key={i} className="w-72 flex-shrink-0 calc-glass p-5 rounded-2xl border border-white/5">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className="fill-[#c9a84c] text-[#c9a84c]" />)}
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-4">"{r.text}"</p>
                <div>
                  <div className="font-bold text-white text-sm">{r.name}</div>
                  <div className="text-[#00d4ff] text-[10px] mt-0.5 uppercase tracking-wide">{r.province}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BRANDS ══════════ */}
      <section className="py-12 bg-white border-y border-slate-100 overflow-hidden">
        <p className="text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-6">
          {t('شركاؤنا من الماركات العالمية', 'Our Global Brand Partners')}
        </p>
        <div className="overflow-hidden">
          <div className="flex gap-6 animate-marquee-rtl" style={{ width: 'max-content' }}>
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <div key={i} className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-7 h-7 bg-[#0a1628] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00d4ff] text-[10px] font-black">{brand.charAt(0)}</span>
                </div>
                <span className="text-slate-500 font-semibold text-xs">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c] via-[#e0c678] to-[#c9a84c]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#0a1628]/10 text-[#0a1628] text-xs font-bold px-4 py-2 rounded-full mb-6">
            <TrendingUp size={14} />
            {t('ابدأ رحلتك المالية الذكية', 'Start Your Smart Financial Journey')}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#0a1628] mb-4 leading-tight">
            {t('جاهز للبدء؟', 'Ready to Start?')}
          </h2>
          <p className="text-[#0a1628]/60 text-base mb-10 max-w-md mx-auto font-light">
            {t('سجّل الآن واحصل على منتجك بأقساط شهرية ميسرة وبدون فوائد خفية', 'Register now and get your product with easy monthly installments and zero hidden interest')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => document.getElementById('all-products')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#0a1628] text-white font-bold px-10 py-4 rounded-xl hover:bg-[#0e2044] transition-colors text-base shadow-xl">
              {t('تصفح المنتجات الآن', 'Browse Products Now')}
            </button>
            <button onClick={() => navigate('/login')} className="border-2 border-[#0a1628] text-[#0a1628] font-bold px-10 py-4 rounded-xl hover:bg-[#0a1628] hover:text-white transition-colors text-base">
              {t('تسجيل حساب جديد', 'Create Account')}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
