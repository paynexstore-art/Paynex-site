"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { calculateInstallment } from "@/lib/pricing";
import Link from "next/link";

export default function ProductsGrid() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(8);
      
      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 container mx-auto px-4 py-12">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
      ))}
    </div>
  );

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#0A1628] mb-12 text-center">أحدث المنتجات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const pricing = calculateInstallment({
              productPrice: Number(product.display_price || product.original_price),
              months: 12,
              interestRate: 0.25,
              adminFee: 150,
              inquiryFee: 100
            });

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-100 group"
              >
                <Link href={`/orders/new?productId=${product.id}`} className="block">
                  <img 
                  src={product.images?.[0] || product.image || 'https://placehold.co/300x300/eee/999?text=No+Image'} 
                  alt={product.name_ar || product.nameEn}
                  className="w-full h-48 object-contain mb-4 rounded-lg cursor-pointer"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/300x300/eee/999?text=No+Image'; }}
                />
                <h3 className="font-bold text-[#0A1628] mb-2 line-clamp-2">{product.name_ar}</h3>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-sm text-gray-500 line-through">{product.original_price} ج.م</span>
                    <div className="text-lg font-bold text-[#C9A84C]">{product.display_price || product.original_price} ج.م</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">قسط يبدأ من</span>
                    <div className="font-bold text-[#10B981]">{pricing.monthlyInstallment} ج.م/شهر</div>
                  </div>
                </div>
                </Link>
                <Link href={`/orders/new?productId=${product.id}`} className="block w-full">
                  <Button className="w-full bg-[#0A1628] hover:bg-[#1a2744] text-white">تسوق الآن</Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
