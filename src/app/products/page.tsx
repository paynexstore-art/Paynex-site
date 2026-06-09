"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { getProductImageUrl } from "@/lib/image";
import { Search } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const categories = ["موبايلات", "لابتوبات", "أجهزة منزلية", "إلكترونيات", "ألعاب"];

  const fetchProducts = async (currentPage: number, search = "", category = "") => {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike("name_ar", `%${search}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query;

    if (!error && data) {
      setProducts(data as Product[]);
      if (count) setTotalCount(count);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(page, searchTerm, selectedCategory);
  }, [page, searchTerm, selectedCategory]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Modern Header matching new design */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#0A1628]">Paynix</span>
            </Link>

            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن منتجات..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full bg-gray-100 border border-gray-200 pl-10 pr-4 py-3 rounded-3xl text-sm focus:outline-none focus:border-[#C9A84C]"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            <Link href="/login" className="text-sm font-medium text-[#0A1628] hover:text-[#C9A84C]">حسابي</Link>
          </div>
        </div>

        {/* Category filter bar */}
        <div className="border-t bg-white">
          <div className="container mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto text-sm">
            <button 
              onClick={() => { setSelectedCategory(""); setPage(1); }}
              className={`px-4 py-1.5 rounded-2xl whitespace-nowrap ${!selectedCategory ? 'bg-[#0A1628] text-white' : 'bg-gray-100'}`}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                className={`px-4 py-1.5 rounded-2xl whitespace-nowrap ${selectedCategory === cat ? 'bg-[#0A1628] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">جميع المنتجات</h1>
            <p className="text-gray-500">{totalCount} منتج متاح للتقسيط</p>
          </div>
          <div className="text-sm text-gray-500">صفحة {page} من {totalPages || 1}</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.length > 0 ? (
                products.map((product) => {
                  const price = Number(product.display_price || product.original_price);
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name_ar}
                      image={product.images?.[0] || ''}
                      originalPrice={product.original_price}
                      displayPrice={price}
                      installmentText={`قسط من ${Math.round(price / 12)} جنيه/شهر`}
                      category={product.category}
                    />
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  لا توجد منتجات مطابقة لبحثك.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2 rounded-2xl border disabled:opacity-50"
                >
                  السابق
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-6 py-2 rounded-2xl border disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
