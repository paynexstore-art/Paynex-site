"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { getProductImageUrl } from "@/lib/image";
import { calculateInstallment } from "@/lib/pricing";

interface Product {
  id: string;
  name_ar: string;
  nameEn?: string;
  display_price?: number;
  original_price: number;
  images?: any;
  category?: string;
  is_active?: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const fetchProducts = async (currentPage: number) => {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data) {
      setProducts(data as Product[]);
      if (count) setTotalCount(count);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#0A1628]">جميع المنتجات</h1>
        <p className="text-gray-500">{totalCount} منتج متاح</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const price = Number(product.display_price || product.original_price);
              const pricing = calculateInstallment({
                productPrice: price,
                months: 12,
                interestRate: 0.25,
                adminFee: 150,
                inquiryFee: 100,
              });

              const imageUrl = getProductImageUrl(product.images?.[0]);

              return (
                <Link
                  href={`/products/${product.id}`}
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-4 border border-gray-100 group"
                >
                  <img
                    src={imageUrl}
                    alt={product.name_ar}
                    className="w-full h-48 object-contain mb-4 rounded-lg group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://placehold.co/400x400/eee/999?text=No+Image";
                    }}
                  />
                  <h3 className="font-bold text-[#0A1628] mb-2 line-clamp-2">{product.name_ar}</h3>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-sm text-gray-500 line-through">{product.original_price} ج.م</span>
                      <div className="text-lg font-bold text-[#C9A84C]">{price} ج.م</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">قسط من</span>
                      <div className="font-bold text-[#10B981]">{pricing.monthlyInstallment} ج.م/شهر</div>
                    </div>
                  </div>
                  <Button className="w-full bg-[#0A1628] hover:bg-[#1a2744] text-white group-hover:bg-[#C9A84C] group-hover:text-[#0A1628]">
                    عرض التفاصيل واشترِ بالتقسيط
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                السابق
              </Button>
              <span className="px-4 py-2">صفحة {page} من {totalPages}</span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </>
      )}

      {products.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">لا توجد منتجات متاحة حالياً.</div>
      )}
    </div>
  );
}
