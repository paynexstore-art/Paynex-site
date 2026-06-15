"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getProductImageUrl, getProductImages } from "@/lib/image";
import { Plus, Edit, Trash, Package, Tag, CheckCircle, XCircle } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, loading: true });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) {
          setProducts(data);
          setStats({
            total: data.length,
            active: data.filter(p => p.is_active || p.isActive).length,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#0A1628]">إدارة المنتجات</h2>
          <p className="text-muted-foreground">إضافة وتعديل المنتجات المتاحة للتقسيط</p>
        </div>
        <Button className="bg-[#0A1628] hover:bg-black text-white gap-2 px-6">
          <Plus size={20} /> إضافة منتج جديد
        </Button>
      </div>

      {/* Products KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المنتجات</CardTitle>
            <Package className="text-blue-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">المنتجات النشطة</CardTitle>
            <CheckCircle className="text-green-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold text-[#0A1628]">المنتج</TableHead>
              <TableHead className="font-bold text-[#0A1628]">الفئة</TableHead>
              <TableHead className="font-bold text-[#0A1628]">السعر</TableHead>
              <TableHead className="font-bold text-[#0A1628]">الحالة</TableHead>
              <TableHead className="font-bold text-[#0A1628] text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد منتجات متاحة حالياً</TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                // FIX: Use getProductImages to safely handle JSON vs Array vs String
                const productImages = getProductImages(product.images, product.category);
                const mainImage = productImages[0];
                
                return (
                  <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border">
                          <img 
                            src={getProductImageUrl(product.images?.[0] || product.image, product.category)} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain" 
                            alt={product.name_ar}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/48x48?text=No+Img"; }} 
                          />
                        </div>
                        <div className="font-medium text-sm">
                          {product.name_ar || product.nameAr}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Tag size={12} /> {product.category || "عام"}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-sm">
                      {product.display_price || product.original_price || product.originalPrice} ج.م
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-bold w-fit ${product.is_active || product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.is_active || product.isActive ? 'نشط' : 'ملغى'}
                      </span>
                    </TableCell>
                    <TableCell className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2 text-xs">
                        <Edit size={14} /> تعديل
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" title="حذف"><Trash size={16} /></Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
