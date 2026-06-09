"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Plus, Trash, CheckCircle } from "lucide-react";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase.from('testimonials').select('*').order('sort_order');
      if (data) setTestimonials(data);
    };
    fetchTestimonials();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة آراء العملاء</h2>
        <Button className="bg-[#0A1628]"><Plus className="ml-2" /> إضافة رأي جديد</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العميل</TableHead>
              <TableHead>المحتوى</TableHead>
              <TableHead>التقييم</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-bold">{t.customer_name}</TableCell>
                <TableCell className="max-w-xs truncate">{t.content}</TableCell>
                <TableCell>{t.rating} / 5</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.is_active ? 'نشط' : 'مخفي'}
                  </span>
                </TableCell>
                <TableCell className="flex gap-2">
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
