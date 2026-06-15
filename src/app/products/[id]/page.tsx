"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getProductImages } from "@/lib/image";
import { ShoppingCart, ArrowRight } from "lucide-react";

interface Product {
  id: string;
  name_ar: string;
  nameEn?: string;
  description_ar?: string;
  display_price?: number;
  original_price: number;
  images?: any;
  category?: string;
  specs?: any;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params?.id) return;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!error && data) {
        setProduct(data as Product);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [params?.id]);

  if (loading) return <div className="container mx-auto px-4 py-12">جاري التحميل...</div>;
  if (!product) return <div className="container mx-auto px-4 py-12">المنتج غير موجود.</div>;

  const price = Number(product.display_price || product.original_price);
  const monthly = Math.round(price / 12);
  const images = getProductImages(product.images, product.category);

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="container mx-auto px-4 py-8">
        <Link href="/products" className="text-sm text-[#F97316] flex items-center gap-1 mb-6 hover:underline">
          ← العودة إلى المنتجات
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Gallery - Modern */}
          <div>
            <div className="bg-white rounded-3xl overflow-hidden border aspect-square flex items-center justify-center p-6">
              <img 
              src={images[selectedImage]} 
              referrerPolicy="no-referrer"
              alt={product.name_ar} 
              className="max-h-[420px] object-contain" 
              onError={(e) => { 
                const target = e.currentTarget as HTMLImageElement;
                const cat = (product.category || '').toLowerCase();
                let fb = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop";
                if (cat.includes('phone') || cat.includes('موبايل')) fb = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=600&fit=crop';
                else if (cat.includes('laptop') || cat.includes('لابتوب')) fb = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop';
                else if (cat.includes('tv') || cat.includes('تلفزيون')) fb = 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop';
                else if (cat.includes('wash') || cat.includes('غسالة') || cat.includes('appliance')) fb = 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop';
                else if (cat.includes('game') || cat.includes('gaming')) fb = 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&h=600&fit=crop';
                target.src = fb;
              }}
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 flex-shrink-0 border-2 rounded-2xl overflow-hidden transition-all ${selectedImage === idx ? 'border-[#F97316] scale-105' : 'border-gray-200'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details - Modern Fintech Style */}
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#F97316] font-semibold mb-1">{product.category || 'منتج'}</div>
              <h1 className="text-4xl font-bold text-[#0A1628] leading-tight">{product.name_ar}</h1>
              {product.nameEn && <p className="text-gray-500 mt-1">{product.nameEn}</p>}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-[#0A1628]">{price.toLocaleString()} <span className="text-base font-normal">ج.م</span></span>
              {product.original_price > price && (
                <span className="text-xl text-gray-400 line-through">{product.original_price.toLocaleString()} ج.م</span>
              )}
            </div>

            {/* Strong Installment CTA */}
            <div className="bg-[#0A1628] text-white rounded-3xl p-6">
              <div className="text-[#C9A84C] text-sm font-medium">تقسيط مريح بدون فوائد إضافية</div>
              <div className="text-3xl font-bold mt-1">قسط من <span className="text-[#F97316]">{monthly}</span> جنيه شهرياً</div>
              <p className="text-xs text-white/70 mt-1">على 12 شهر • موافقة فورية</p>

              <Link href={`/orders/new?productId=${product.id}`}>
                <button className="mt-4 w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl active:scale-[0.985]">
                  اشترِ الآن بالتقسيط <ArrowRight size={18} />
                </button>
              </Link>
            </div>

            {product.description_ar && (
              <div>
                <h3 className="font-semibold mb-2">الوصف</h3>
                <p className="text-gray-700 leading-relaxed">{product.description_ar}</p>
              </div>
            )}

            {product.specs && Object.keys(product.specs).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">المواصفات الرئيسية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between bg-white p-3 rounded-2xl border">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-medium text-right">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
