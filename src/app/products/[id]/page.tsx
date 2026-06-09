"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { getProductImages } from "@/lib/image";
import { calculateInstallment } from "@/lib/pricing";

interface Product {
  id: string;
  name_ar: string;
  nameEn?: string;
  description_ar?: string;
  descriptionEn?: string;
  display_price?: number;
  original_price: number;
  images?: any;
  category?: string;
  brand?: string;
  specs?: any;
  is_active?: boolean;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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
  const pricing = calculateInstallment({
    productPrice: price,
    months: 12,
    interestRate: 0.25,
    adminFee: 150,
    inquiryFee: 100,
  });

  const images = getProductImages(product.images);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square bg-white rounded-2xl overflow-hidden border mb-4">
            <img
              src={images[selectedImage]}
              alt={product.name_ar}
              className="w-full h-full object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/600x600/eee/999?text=No+Image"; }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 flex-shrink-0 border-2 rounded-lg overflow-hidden ${selectedImage === idx ? "border-[#C9A84C]" : "border-gray-200"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-[#0A1628] mb-2">{product.name_ar}</h1>
          {product.nameEn && <p className="text-gray-500 mb-4">{product.nameEn}</p>}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-[#C9A84C]">{price} ج.م</span>
            {product.original_price > price && (
              <span className="text-xl text-gray-400 line-through">{product.original_price} ج.م</span>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-medium">قسط شهري يبدأ من <span className="text-2xl font-bold">{pricing.monthlyInstallment}</span> ج.م</p>
            <p className="text-sm text-green-600">لمدة 12 شهر (مع فائدة 25% + رسوم)</p>
          </div>

          {product.description_ar && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">الوصف</h3>
              <p className="text-gray-700 leading-relaxed">{product.description_ar}</p>
            </div>
          )}

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">المواصفات</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(product.specs).map(([key, value]) => (
                  <li key={key} className="flex justify-between border-b pb-1">
                    <span className="text-gray-600">{key}</span>
                    <span className="font-medium">{String(value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link href={`/orders/new?productId=${product.id}`} className="flex-1">
              <Button className="w-full h-14 text-lg bg-[#0A1628] hover:bg-[#1a2744]">
                اشترِ الآن بالتقسيط
              </Button>
            </Link>
            <Link href="/calculator" className="flex-1">
              <Button variant="outline" className="w-full h-14 text-lg border-[#C9A84C] text-[#C9A84C]">
                احسب قسطك
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            رسوم استعلام تدفع عند توقيع العقد ورفع المستندات
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/products" className="text-[#C9A84C] hover:underline">← العودة إلى جميع المنتجات</Link>
      </div>
    </div>
  );
}
