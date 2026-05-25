import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/features/ProductCard';
import { createClient } from '@supabase/supabase-js'; // استدعاء مباشر لحل مشكلة عدم وجود الملف المساعد
import { PRODUCT_CATEGORIES } from '@/constants/categories';
import { useApp } from '@/contexts/AppContext';
import type { Product } from '@/types';

// اتصال مستقل ومباشر لتجنب خطأ مسار الملف المفقود أثناء الـ Build
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ProductsPage() {
  const { t } = useApp();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('isActive', true);

        if (error) {
          console.error('Error fetching products from Supabase:', error);
        } else if (data) {
          const sortedData = [...data].sort(
            (a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
          );
          setProducts(sortedData);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        p =>
          p.nameAr?.toLowerCase().includes(term) ||
          p.nameEn?.toLowerCase().includes(term) ||
          p.descriptionAr?.toLowerCase().includes(term) ||
          p.descriptionEn?.toLowerCase().includes(term)
      );
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else {
      result.sort(
        (a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
      );
    }

    return result;
  }, [products, selectedCategory, searchTerm, sortBy]);

  const groupedByCategory = useMemo(() => {
    const groups: { [key: string]: Product[] } = {};
    filteredProducts.forEach(product => {
      if (!groups[product.category]) {
        groups[product.category] = [];
      }
      groups[product.category].push(product);
    });
    return Object.entries(groups);
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-[#fafafc] text-slate-800">
      <Navbar />

      <div className="bg-gradient-to-r from-[#0a1628] to-[#1a3050] text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#00d4ff/10,transparent_50%)]" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            {t('تصفح منتجاتنا الذكية', 'Browse Our Smart Products')}
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto text-sm md:text-base">
            {t(
              'كل ما تحتاجه بأقساط ميسرة تناسب ميزانيتك وبدون مقدمات معقدة',
              'Everything you need with easy installments that suit your budget'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('ابحث عن منتج، ماركة، أو مواصفات...', 'Search for a product, brand...')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00d4ff] transition-all"
              />
            </div>

            <div className="relative">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={selectedCategory || ''}
                onChange={e => setSelectedCategory(e.target.value || null)}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-[#00d4ff] transition-all"
              >
                <option value="">{t('كل الأقسام والفئات', 'All Categories')}</option>
                {PRODUCT_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {t(category.nameAr, category.nameEn)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00d4ff] transition-all"
              >
                <option value="newest">{t('الأحدث مضافاً', 'Newest')}</option>
                <option value="price-low">{t('السعر: من الأقل للأعلى', 'Price: Low to High')}</option>
                <option value="price-high">{t('السعر: من الأعلى للأقل', 'Price: High to Low')}</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#0a1628] border-t-[#00d4ff] rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">{t('جاري تحميل المنتجات الحية...', 'Loading live products...')}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center bg-white rounded-2xl border border-dashed border-slate-200 p-12">
            <span className="text-5xl block mb-4">🔍</span>
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              {t('لا توجد منتجات مطابقة', 'No products found')}
            </h3>
            <p className="text-slate-400 text-sm">
              {t('جرب تغيير خيارات الفلترة أو كتابة كلمة بحث أخرى', 'Try changing the filters or search term')}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedByCategory.map(([categoryId, categoryProducts]) => {
              const category = PRODUCT_CATEGORIES.find(c => c.id === categoryId);
              return (
                <div key={categoryId}>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#00d4ff]/20">
                    <span className="text-3xl">{category?.icon || '📦'}</span>
                    <div>
                      <h2 className="text-2xl font-black text-[#0a1628]">
                        {t(category?.nameAr || '', category?.nameEn || '')}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {t(
                          `${categoryProducts.length} منتج`,
                          `${categoryProducts.length} products`
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
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

      <Footer />
    </div>
  );
}
