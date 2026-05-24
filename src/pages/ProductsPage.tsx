import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/features/ProductCard';
import { getProducts } from '@/lib/storage';
import { PRODUCT_CATEGORIES, getCategoryName } from '@/constants/categories';
import { useApp } from '@/contexts/AppContext';
import type { Product } from '@/types';

export default function ProductsPage() {
  const { t } = useApp();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  // Load all products
  useEffect(() => {
    const allProducts = getProducts()
      .filter(p => p.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setProducts(allProducts);
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nameAr.toLowerCase().includes(term) ||
        p.nameEn.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.descriptionAr.toLowerCase().includes(term)
      );
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCategory, searchTerm, sortBy]);

  // Group by category for display
  const groupedByCategory = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    filteredProducts.forEach(p => {
      if (!grouped.has(p.category)) {
        grouped.set(p.category, []);
      }
      grouped.get(p.category)!.push(p);
    });
    return Array.from(grouped.entries()).sort((a, b) => {
      const catA = PRODUCT_CATEGORIES.find(c => c.id === a[0]);
      const catB = PRODUCT_CATEGORIES.find(c => c.id === b[0]);
      return (catA?.order ?? 99) - (catB?.order ?? 99);
    });
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#0a1628] mb-3">
            {t('جميع المنتجات', 'All Products')}
          </h1>
          <p className="text-slate-500">
            {t(
              `عرض جميع المنتجات المتاحة - ${filteredProducts.length} منتج`,
              `Showing all available products - ${filteredProducts.length} items`
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('ابحث عن منتج...', 'Search products...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 transition"
              />
            </div>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 transition"
          >
            <option value="newest">{t('الأحدث', 'Newest')}</option>
            <option value="price-low">{t('الأقل سعراً', 'Price: Low to High')}</option>
            <option value="price-high">{t('الأعلى سعراً', 'Price: High to Low')}</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-slate-200">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 rounded-full font-semibold transition ${
              selectedCategory === null
                ? 'bg-[#0a1628] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('الكل', 'All')}
          </button>
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full font-semibold transition flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-[#0a1628] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              {t(cat.nameAr, cat.nameEn)}
            </button>
          ))}
        </div>

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-bold text-slate-400 mb-3">
              {t('لا توجد منتجات', 'No products found')}
            </p>
            <p className="text-slate-400">
              {t('حاول تغيير معايير البحث', 'Try changing your search criteria')}
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
                          `${categoryProducts.length} products`
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
