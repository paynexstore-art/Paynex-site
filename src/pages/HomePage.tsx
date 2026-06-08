import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  Shield, Zap, CreditCard, Star,
  CheckCircle, TrendingUp, MapPin, Calculator
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

// Direct Supabase client initialization (self-contained, no external file dependencies)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ── 20 Testimonials ── */
const TESTIMONIALS = [
  { name: 'أحمد محمد', province: 'القاهرة', text: 'خدمة رائعة! حصلت على موبايلي بقسط شهري بسيط وبدون أي مشاكل. تجربة من الذ' },
  { name: 'سارة علي', province: 'الجيزة', text: 'المشرف كان محترماً جداً وإجراءات سريعة. باينكس غيرت فكرتي عن التقسيط تمام' },
  { name: 'محمود حسن', province: 'الإسكندرية', text: 'أفضل خدمة تقسيط في مصر. أسعار مناسبة وخدمة عملاء استثنائية.' },
  { name: 'فاطمة إبراهيم', province: 'الشرقية', text: 'كنت محتاجة لابتوب للشغل وباينكس حلت مشكلتي في أسرع وقت ممكن.' },
  { name: 'عمر خالد', province: 'الإسماعيلية', text: 'اشتريت تليفزيون كبير وقسطته على 24 شهر، الدفعة الشهرية خفيفة جداً عل' },
  { name: 'منى سعيد', province: 'المنيا', text: 'تعامل راقي من المشرف وسرعة في إتمام الطلب. نصحت كل أصحابي بباينكس.' },
  { name: 'كريم رمضان', province: 'أسيوط', text: 'بدون فوائد حقيقي! حصلت على PS5 بسهولة تامة. الكلام ده صحيح فعلاً.' },
  { name: 'هدى عبد الله', province: 'قنا', text: 'خدمة عملاء ممتازة والمشرف رد في أقل من ساعة على جميع استفساراتي.' },
  { name: 'أيمن طه', province: 'سوهاج', text: 'الموقع سهل جداً وواضح. قدمت الطلب واتقبل في نفس اليوم تقريباً.' },
  { name: 'نهاد مصطفى', province: 'بني سويف', text: 'اشتريت غسالة جديدة لبيتي بدون أي ضغط مالي. شكراً باينكس على الخدمة الر' },
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

  // Fetch total product count from Supabase
  useEffect(() => {
    async function fetchTotalProductCount() {
      try {
        console.log('🔄 Fetching total product count from Supabase...');

        // Get only count without fetching all data
        const { count, error: countError } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true });

        if (countError) {
          console.error('❌ Error fetching product count:', countError);
          setTotalProductCount(0);
        } else {
          const actualCount = count || 0;
          console.log(`📊 Total products in database: ${actualCount}`);
          setTotalProductCount(actualCount);
        }
      } catch (err) {
        console.error('❌ Unexpected error fetching product count:', err);
        setTotalProductCount(0);
      }
    }

    fetchTotalProductCount();
  }, []);

  // Fetch live products from Supabase and group by category
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        console.log('🔄 Fetching live products from Supabase for homepage...');
        console.log('Supabase URL:', supabaseUrl ? '✅ Configured' : '❌ Missing');
        console.log('Supabase Key:', supabaseAnonKey ? '✅ Configured' : '❌ Missing');

        // Fetch active products ordered by newest first (limited for homepage display)
        const { data, error: queryError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(100); // Limit to prevent excessive data transfer

        if (queryError) {
          console.error('❌ Error fetching products from Supabase:', queryError);
          setProducts([]);
          setProductsByCategory(new Map());
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          console.warn('⚠️ No active products found in Supabase');
          setProducts([]);
          setProductsByCategory(new Map());
          setLoading(false);
          return;
        }

        console.log(`📊 Fetched ${data.length} active products from Supabase`);

        // Manual mapping from Supabase underscored columns to Product interface
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

        console.log(`✅ Mapped ${mappedProducts.length} products`);

        // Group products by category
        const grouped = new Map<string, Product[]>();
        mappedProducts.forEach(p => {
          if (!grouped.has(p.category)) {
            grouped.set(p.category, []);
          }
          grouped.get(p.category)!.push(p);
        });

        setProducts(mappedProducts);
        setProductsByCategory(grouped);
      } catch (err) {
        console.error('❌ Unexpected error fetching products:', err);
        setProducts([]);
        setProductsByCategory(new Map());
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Banner rotation
  const activeBannerCount = (settings?.banners ?? []).filter(b => b?.isActive).length || 1;
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(i => (i + 1) % activeBannerCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBannerCount]);

  // Animate counters
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
    {
      icon: CreditCard,
      titleAr: 'أقساط من 0 مقدم', titleEn: 'Zero Down Payment',
      descAr: 'لا مقدم ولا فوائد خفية', descEn: 'No down payment, no hidden interest',
      color: 'bg-[#00d4ff]/10 text-[#00d4ff]',
    },
    {
      icon: Zap,
      titleAr: 'موافقة سريعة', titleEn: 'Fast Approval',
      descAr: 'قرار خلال ساعات قليلة', descEn: 'Decision within hours',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Shield,
      titleAr: 'بيانات آمنة', titleEn: 'Secure Data',
      descAr: 'تشفير كامل لبياناتك الشخصية', descEn: 'Full AES-256 encryption',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: MapPin,
      titleAr: 'مشرفون محليون', titleEn: 'Local Supervisors',
      descAr: 'خدمة ميدانية في جميع المحافظات', descEn: 'Field service across all provinces',
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  const steps = [
    { num: '01', titleAr: 'اختر منتجك', titleEn: 'Choose Product', descAr: 'تصفح مئات المنتجات من أفضل الماركات', descEn: 'Browse hundreds of products' },
    { num: '02', titleAr: 'احسب قسطك', titleEn: 'Calculate Installment', descAr: 'استخدم الحاسبة التفاعلية', descEn: 'Use our calculator' },
    { num: '03', titleAr: 'قدم طلبك', titleEn: 'Submit Request', descAr: 'أكمل نموذج الطلب', descEn: 'Fill in your details' },
    { num: '04', titleAr: 'استلم منتجك', titleEn: 'Receive Product', descAr: 'بعد الموافقة يصلك المشرف', descEn: 'Get your product' },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />
      <PWAInstallBanner />

      {/* ══════════ HERO SECTION ══════════ */}
      <section className="relative min-h-[92vh] overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img
            src={currentBanner?.imageUrl ?? paynexHero}
            alt="PayNex باينكس"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0a1628]/95 via-[#0a1628]/80 to-[#0a1628]/50" />
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-sm font-semibold px-4 py-2 rounded-full mb-6 backdrop-blur">
              <span className="w-2 h-2 bg-[#00d4ff] rounded-full animate-pulse" />
              {t('التقسيط الذكي في مصر', 'Smart Installments in Egypt')}
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-4">
              {t('اشتري الآن', 'Buy Now')}<br />
              <span className="text-gradient-cyan">{t('ادفع بالأقساط', 'Pay in Installments')}</span>
            </h1>

            <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
              {t(
                'باينكس تقدم لك حلول التقسيط الذكي على أحدث المنتجات الإلكترونية بدون فوائد خفية',
                'PayNex offers smart installment solutions with zero hidden interest'
              )}
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {[
                t('✓ بدون فوائد', '✓ Zero Interest'),
                t('✓ من 0 مقدم', '✓ 0 Down Payment'),
                t('✓ موافقة سريعة', '✓ Fast Approval'),
                t('✓ 27 محافظة', '✓ 27 Provinces'),
              ].map(item => (
                <span key={item} className="bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full">
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => document.getElementById('all-products')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-cyan text-base px-8 py-4 text-[#0a1628] font-black shadow-[0_4px_30px_rgba(0,212,255,0.4)] hover:shadow-[0_8px_40px_rgba(0,212,255,0.6)] transition-all"
              >
                {t('تصفح المنتجات', 'Browse Products')}
              </button>
              <button
                onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all"
              >
                <Calculator size={18} />
                {t('احسب قسطك', 'Calculate Now')}
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 end-6 hidden lg:block">
          <div className="calc-glass rounded-2xl p-5 text-white w-56">
            <div className="text-xs text-white/50 mb-1">{t('مثال — آيفون 15 برو', 'Example — iPhone 15 Pro')}</div>
            <div className="text-2xl font-black text-[#00d4ff]">{t('3,850 ج.م / شهر', 'EGP 3,850/mo')}</div>
            <div className="text-xs text-white/60 mt-1">{t('على 12 شهر — بدون فوائد', '12 months — zero interest')}</div>
          </div>
        </div>

        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {activeBanners.map((_, i) => (
              <button key={i} onClick={() => setBannerIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === bannerIndex ? 'bg-[#00d4ff] w-8' : 'bg-white/30 w-3'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══════════ STATS BAR ══════════ */}
      <section ref={statsRef} className="bg-[#0a1628] py-10 border-y border-[#00d4ff]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              {
                value: count1 >= 1000000 ? '+مليون' : `+${count1.toLocaleString('ar-EG')}`,
                label: t('عميل سعيد', 'Happy Customer'),
                color: 'text-[#00d4ff]',
              },
              {
                value: count2 >= 1000 ? `+${Math.floor(count2 / 1000)}ألف` : count2,
                label: t('منتج متاح', 'Available Products'),
                color: 'text-[#c9a84c]',
              },
              { value: '27', label: t('محافظة مغطاة', 'Provinces Covered'), color: 'text-[#00d4ff]' },
              { value: '0%', label: t('فوائد', 'Interest Rate'), color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="group">
                <div className={`text-3xl md:text-4xl font-black mb-1 ${s.color}`}>{s.value}</div>
                <div className="text-white/50 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CATEGORIES ══════════ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="section-title text-center mb-2">{t('تصفح حسب الفئة', 'Browse by Category')}</h2>
          <p className="text-slate-500 text-center text-sm mb-10">{t('مئات المنتجات في كل فئة', 'Hundreds of products in each category')}</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/products?category=${cat.id}`)}
                className="card-surface p-5 flex flex-col items-center gap-3 group hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="text-sm font-semibold text-[#0a1628] text-center">{t(cat.nameAr, cat.nameEn)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WHY PAYNEX ══════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="badge-cyan mb-4 inline-block">{t('لماذا باينكس؟', 'Why PayNex?')}</div>
              <h2 className="text-4xl font-black text-[#0a1628] leading-tight mb-4">
                {t('التمويل الذكي', 'Smart Financing')}<br />
                <span className="text-gradient-cyan">{t('للجيل القادم', 'For the Next Generation')}</span>
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                {t(
                  'باينكس ليست مجرد تقسيط — هي منظومة مالية ذكية',
                  'PayNex is not just installments — it\'s a smart financial ecosystem'
                )}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#00d4ff]/30 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                        <Icon size={20} />
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
                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/3 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-[#0a1628] text-[#00d4ff] flex items-center justify-center font-black text-lg flex-shrink-0 group-hover:bg-[#00d4ff] group-hover:text-[#0a1628]">
                    {step.num}
                  </div>
                  <div>
                    <div className="font-bold text-[#0a1628] mb-1">{t(step.titleAr, step.titleEn)}</div>
                    <div className="text-slate-500 text-sm">{t(step.descAr, step.descEn)}</div>
                  </div>
                  <CheckCircle size={18} className="text-emerald-400 ms-auto flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ALL PRODUCTS ══════════ */}
      <section id="all-products" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <div className="badge-navy mb-3 inline-block">{t('جميع المنتجات', 'All Products')}</div>
            <h2 className="section-title">{t('أحدث الإلكترونيات المتاحة', 'Latest Available Electronics')}</h2>
            <p className="text-slate-500 mt-2">{t(`أكثر من ${totalProductCount > 0 ? totalProductCount.toLocaleString('ar-EG') : products.length} منتج بأقساط ميسرة`, `${totalProductCount > 0 ? totalProductCount.toLocaleString() : products.length} products with easy installments`)}</p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <p className="text-2xl font-bold text-slate-400">{t('جاري تحميل المنتجات...', 'Loading products...')}</p>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl font-bold text-slate-400">{t('لا توجد منتجات متاحة', 'No products available')}</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            /* Products by Category */
            <div className="space-y-16">
              {PRODUCT_CATEGORIES.map(category => {
                const categoryProducts = productsByCategory.get(category.id) || [];
                if (categoryProducts.length === 0) return null;

                return (
                  <div key={category.id}>
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-[#00d4ff]/20">
                      <span className="text-4xl">{category.icon}</span>
                      <div>
                        <h3 className="text-2xl font-black text-[#0a1628]">
                          {t(category.nameAr, category.nameEn)}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {t(`${categoryProducts.length} منتج`, `${categoryProducts.length} products`)}
                        </p>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
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

      {/* ══════════ CALCULATOR ══════════ */}
      <section id="calculator" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-paynex" />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00d4ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] text-sm font-medium px-4 py-2 rounded-full mb-4">
              <Calculator size={15} />
              {t('حاسبة التقسيط التفاعلية', 'Interactive Calculator')}
            </div>
            <h2 className="text-4xl font-black text-white mb-3">{t('احسب قسطك الشهري', 'Calculate Your Monthly Payment')}</h2>
            <p className="text-white/60">{t('نتيجة فورية', 'Instant result')}</p>
          </div>

          <div className="calc-glass rounded-3xl p-6 md:p-8">
            <InstallmentCalculator productPrice={20000} />
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="py-16 bg-[#0a1628] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
          <div className="badge-cyan mx-auto mb-3 inline-block">{t('آراء العملاء', 'Customer Reviews')}</div>
          <h2 className="text-3xl font-bold text-white">{t('مليون+ عميل يثق في باينكس', '1M+ Customers Trust PayNex')}</h2>
        </div>

        <div className="mb-4 overflow-hidden">
          <div className="flex gap-4 animate-marquee-rtl" style={{ width: 'max-content' }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((r, i) => (
              <div key={i} className="w-72 flex-shrink-0 calc-glass p-5 rounded-2xl">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className="fill-[#c9a84c] text-[#c9a84c]" />)}
                </div>
                <p className="text-white/75 text-xs leading-relaxed mb-4">"{r.text}"</p>
                <div>
                  <div className="font-bold text-white text-sm">{r.name}</div>
                  <div className="text-[#00d4ff] text-xs mt-0.5">{r.province}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BRANDS ══════════ */}
      <section className="py-10 bg-white border-y border-slate-100 overflow-hidden">
        <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-6">
          {t('شركاؤنا من الماركات العالمية', 'Our Global Brand Partners')}
        </p>
        <div className="overflow-hidden">
          <div className="flex gap-6 animate-marquee-rtl" style={{ width: 'max-content' }}>
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <div key={i} className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 bg-[#0a1628] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00d4ff] text-xs font-black">{brand.charAt(0)}</span>
                </div>
                <span className="text-slate-600 font-semibold text-sm">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA SECTION ══════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c] via-[#e0c678] to-[#c9a84c]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#0a1628]/10 text-[#0a1628] text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <TrendingUp size={15} />
            {t('ابدأ رحلتك المالية الذكية', 'Start Your Smart Financial Journey')}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#0a1628] mb-4">
            {t('جاهز للبدء؟', 'Ready to Start?')}
          </h2>
          <p className="text-[#0a1628]/70 text-lg mb-10 max-w-xl mx-auto">
            {t('سجّل الآن واحصل على منتجك بأقساط شهرية ميسرة', 'Register now and get easy monthly installments')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => document.getElementById('all-products')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#0a1628] text-white font-bold px-10 py-4 rounded-xl hover:bg-[#0e2044] transition-colors text-lg shadow-xl"
            >
              {t('تصفح المنتجات الآن', 'Browse Products Now')}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border-2 border-[#0a1628] text-[#0a1628] font-bold px-10 py-4 rounded-xl hover:bg-[#0a1628] hover:text-white transition-colors text-lg"
            >
              {t('تسجيل حساب جديد', 'Create Account')}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
