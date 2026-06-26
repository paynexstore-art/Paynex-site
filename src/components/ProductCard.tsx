"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { getProductImageUrl } from '@/lib/image';

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  originalPrice: number;
  displayPrice: number;
  installmentText: string;
  category?: string;
}

export default function ProductCard({ 
  id, 
  name, 
  image, 
  originalPrice, 
  displayPrice, 
  installmentText,
  category 
}: ProductCardProps) {
  const discount = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);

  // Resolve image: if the prop is already a full URL from DB, use it directly (each product has its own)
  // Otherwise, use the helper which handles paths or provides category-specific beautiful fallback
  const resolvedImage = (image && (image.startsWith('http://') || image.startsWith('https://'))) 
    ? image 
    : getProductImageUrl(image, category);

  return (
    <Link 
      href={`/orders/new?productId=${id}`} 
      className="group block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex-shrink-0 w-full"
    >
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
          <img 
            src={resolvedImage} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              // Use category-aware fallback if available, otherwise a nice default
              const cat = (category || '').toLowerCase();
              let fallback = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&auto=format';
              if (cat.includes('phone') || cat.includes('موبايل')) fallback = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=600&fit=crop&auto=format';
              else if (cat.includes('laptop') || cat.includes('لابتوب')) fallback = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format';
              else if (cat.includes('tv') || cat.includes('تلفزيون')) fallback = 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop&auto=format';
              else if (cat.includes('wash') || cat.includes('غسالة') || cat.includes('appliance')) fallback = 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format';
              else if (cat.includes('game') || cat.includes('gaming')) fallback = 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&h=600&fit=crop&auto=format';
              target.src = fallback;
            }}
          />
        </div>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            خصم {discount}%
          </div>
        )}

        {/* Installment Badge - Very Prominent like B.TECH */}
        <div className="absolute bottom-3 left-3 bg-[#0A1628] text-white text-[11px] font-semibold px-3 py-1.5 rounded-2xl flex items-center gap-1 shadow">
          <span>{installmentText}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-semibold text-[#0A1628] text-[15px] leading-tight line-clamp-2 min-h-[42px]">
          {name}
        </h3>

        {/* Prices */}
        <div className="flex items-end gap-2">
          <span className="text-xl font-bold text-[#0A1628]">{displayPrice.toLocaleString()} <span className="text-xs">ج.م</span></span>
          {originalPrice > displayPrice && (
            <span className="text-sm text-gray-400 line-through">{originalPrice.toLocaleString()} ج.م</span>
          )}
        </div>

        {/* Add to Cart - Appears on Hover (Desktop) */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            // Could add to cart logic here
            window.location.href = `/orders/new?productId=${id}`;
          }}
          className="w-full hidden group-hover:flex items-center justify-center gap-2 bg-[#F97316] hover:bg-orange-600 text-white font-semibold py-2.5 rounded-2xl text-sm transition-all active:scale-[0.985]"
        >
          <ShoppingCart size={16} />
          أضف إلى السلة
        </button>

        {/* Mobile always visible CTA */}
        <button className="md:hidden w-full flex items-center justify-center gap-2 bg-[#F97316] text-white font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.985]">
          <ShoppingCart size={16} />
          اشترِ بالتقسيط
        </button>
      </div>
    </Link>
  );
}
