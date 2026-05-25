import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/features/ProductCard';
import { createClient } from '@supabase/supabase-js';
import { PRODUCT_CATEGORIES } from '@/constants/categories';
import { useApp } from '@/contexts/AppContext';
import type { Product } from '@/types';

// Direct Supabase client initialization (self-contained, no external file dependencies)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definition for database product row
interface SupabaseProduct {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  original_price?: number;
  image_url: string;
  images?: string[] | string;
  brand: string;
  category_en: string;
  category_ar: string;
  is_active: boolean;
  stock: number;
  created_at: string;
  updated_at?: string;
  monthly_interest_rate?: number;
}

// Map database fields to Product type
function mapSupabaseToProduct(item: SupabaseProduct): Product {
  // Parse images - handle both array and stringified JSON
  let images: string[] = [];
  if (item.images) {
    if (Array.isArray(item.images)) {
      images = item.images.filter((img): img is string => typeof img === 'string');
    } else if (typeof item.images === 'string') {
      try {
        const parsed = JSON.parse(item.images);
        images = Array.isArray(parsed) ? parsed : [item.image_url];
      } catch {
        images = [item.image_url];
      }
    }
  }
  
  if (images.length === 0) {
    images = [item.image_url];
  }

  return {
    id: item.id,
    name: item.name_en,
    nameAr: item.name_ar,
    nameEn: item.name_en,
    description: item.description_en,
    descriptionAr: item.description_ar,
    descriptionEn: item.description_en,
    price: item.price,
    originalPrice: item.original_price,
    images: images,
    category: item.category_en,
    categoryAr: item.category_ar,
    brand: item.brand,
    source: 'manual',
    isActive: item.is_active,
    stock: item.stock,
    createdAt: item.created_at,
  };
}

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
  const [error, setError] = useState<string | null>(null);

  // Fetch live products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (queryError) {
          console.error('Error fetching products from Supabase:', queryError);
          setError(queryError.message);
          return;
        }

        if (data && Array.isArray(data)) {
          const mappedProducts = data.map(mapSupabaseToProduct);
          setProducts(mappedProducts);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Unexpected error fetching products:', err);
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        p =>
          p.nameAr?.toLowerCase().includes(term) ||
          p.nameEn?.toLowerCase().includes(term) ||
          p.descriptionAr?.toLowerCase().includes(term) ||
          p.descriptionEn?.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term)
      );
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // Newest first (already sorted from Supabase, but re-sort to be safe)
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    return result;
  }, [products, selectedCategory, searchTerm, sortBy]);

  // Group products by category
  const groupedByCategory = useMemo(() => {
    const groups: { [key: string]: Product[] } = {};
    filteredProducts.forEach(product => {
      if (!groups[product.category]) {
        groups[product.category] = [];
      }
      groups[product.category].push(product);
    });
    return Object.entries(groups).sort((a, b) => {
      const catA = PRODUCT_CATEGORIES.find(c => c.id === a[0]);
      const catB = PRODUCT_CATEGORIES.find(c => c.id === b[0]);
      return (catA?.order ?? 999) - (catB?.order ?? 999);
    });
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
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
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

            {/* Category Filter */}
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

            {/* Sort Options */}
            <div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'newest' | 'price-low' | 'price-high')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00d4ff] transition-all"
              >
                <option value="newest">{t('الأحدث مضافاً', 'Newest')}</option>
                <option value="price-low">{t('السعر: من الأقل للأعلى', 'Price: Low to High')}</option>
                <option value="price-high">{t('السعر: من الأعلى للأقل', 'Price: High to Low')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#0a1628] border-t-[#00d4ff] rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium">
              {t('جاري تحميل المنتجات الحية...', 'Loading live products...')}
            </p>
          </div>
        ) : error ? (
          <div className="text-center bg-white rounded-2xl border border-dashed border-red-200 p-12">
            <span className="text-5xl block mb-4">⚠️</span>
            <h3 className="text-lg font-bold text-red-600 mb-1">
              {t('خطأ في تحميل المنتجات', 'Error Loading Products')}
            </h3>
            <p className="text-slate-500 text-sm">{error}</p>
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
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#00d4ff]/20">
                    <span className="text-3xl">{category?.icon || '📦'}</span>
                    <div>
                      <h2 className="text-2xl font-black text-[#0a1628]">
                        {t(category?.nameAr || '', category?.nameEn || '')}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {t(
                          `${categoryProducts.length} منتج`,
                          `${categoryProducts.length} product${categoryProducts.length !== 1 ? 's' : ''}`
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Products Grid */}
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
