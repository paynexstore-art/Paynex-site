import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Tag } from 'lucide-react';
import type { Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';
import { calculateInstallment } from '@/lib/installment';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate();
  const { t, lang } = useApp();

  // Use nameAr/nameEn with fallbacks
  const name = lang === 'ar' 
    ? (product.nameAr || product.nameEn || 'منتج بدون اسم')
    : (product.nameEn || product.nameAr || 'Product without name');

  // Ensure we have a valid image URL
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0]
    : 'https://via.placeholder.com/400x400?text=No+Image';

  // Fallback category display
  const categoryDisplay = lang === 'ar'
    ? (product.categoryAr || product.category || 'أخرى')
    : (product.category || 'Other');

  const plan = calculateInstallment({
    productPrice: product.price,
    downPayment: 0,
    months: 12,
  });

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Validation logging in development
  if (process.env.NODE_ENV === 'development') {
    if (!product.id || !product.nameAr || !product.nameEn || !imageUrl || product.price === undefined) {
      console.warn('⚠️ ProductCard received incomplete product data:', {
        id: product.id,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        imageUrl,
        price: product.price,
        fullProduct: product,
      });
    }
  }

  return (
    <div
      className="group cursor-pointer rounded-[1.25rem] overflow-hidden bg-white border border-slate-100/80 shadow-[0_2px_12px_rgba(10,22,40,0.06)] hover:shadow-[0_8px_30px_rgba(10,22,40,0.12)] hover:-translate-y-1 transition-all duration-300"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-slate-50 rounded-t-[1.25rem]">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            console.warn('Image load error for product:', product.id, imageUrl);
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+Error';
          }}
        />
        {discountPercent > 0 && (
          <div className="absolute top-3 start-3 bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
            -{discountPercent}%
          </div>
        )}
        <div className="absolute top-3 end-3 flex flex-col gap-1">
          <span className="bg-[#0a1628]/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full max-w-[80px] truncate" title={categoryDisplay}>
            {categoryDisplay}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start gap-2 mb-2">
          <Tag size={14} className="text-[#d4a339] mt-1 flex-shrink-0" />
          <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">
            {name}
          </h3>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={12} className="fill-[#d4a339] text-[#d4a339]" />
          ))}
          <span className="text-xs text-slate-400 ms-1">(4.8)</span>
        </div>

        <div className="flex items-end justify-between mb-3 flex-1">
          <div>
            <div className="text-xs text-slate-400">{t('السعر', 'Price')}</div>
            <div className="font-bold text-lg text-[#0f2460]">
              {formatCurrency(product.price, lang)}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="text-xs text-slate-400 line-through">
                {formatCurrency(product.originalPrice, lang)}
              </div>
            )}
          </div>
          <div className="text-end">
            <div className="text-xs text-slate-400">{t('أو قسط شهري', 'Or monthly')}</div>
            <div className="installment-badge text-xs">
              {formatCurrency(plan.monthlyPayment, lang)}/{t('شهر', 'mo')}
            </div>
          </div>
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            navigate(`/order/${product.id}`);
          }}
          className="btn-gold w-full text-sm flex items-center justify-center gap-2 mt-auto"
        >
          <ShoppingCart size={16} />
          {t('اطلب بالتقسيط', 'Order in Installments')}
        </button>
      </div>
    </div>
  );
}
