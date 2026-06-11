"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getProductImageUrl } from "@/lib/image";
import { Plus, Edit, Trash } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المنتجات</h2>
        <Button className="bg-[#0A1628]"><Plus className="ml-2" /> إضافة منتج جديد</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المنتج</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <img src={getProductImageUrl(product.images?.[0])} className="w-10 h-10 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/40x40/eee/999?text=No"; }} />
                    {product.name_ar || product.nameAr}
                  </div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.display_price || product.original_price || product.originalPrice} ج.م</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${product.is_active || product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.is_active || product.isActive ? 'نشط' : 'ملغى'}
                  </span>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="ghost" size="icon"><Edit size={16} /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500"><Trash size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
