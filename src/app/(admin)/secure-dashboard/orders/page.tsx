"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Eye, CheckCircle, XCircle } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`*, product:products(*)`)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { label: "قيد الانتظار", color: "bg-gray-100 text-gray-700" },
      under_inquiry: { label: "جاري الاستعلام", color: "bg-yellow-100 text-yellow-700" },
      admin_review: { label: "مراجعة الإدارة", color: "bg-blue-100 text-blue-700" },
      approved: { label: "تمت الموافقة", color: "bg-green-100 text-green-700" },
      rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
      delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700" },
    };
    const s = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700" };
    return <span className={`px-2 py-1 rounded text-xs font-bold ${s.color}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">إدارة الطلبات</h2>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطلب</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>المنتج</TableHead>
              <TableHead>المحافظة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-bold">{order.order_number}</TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{order.product?.name_ar}</TableCell>
                <TableCell>{order.customer_governorate}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="ghost" size="icon" title="عرض التفاصيل"><Eye size={16} /></Button>
                  <Button variant="ghost" size="icon" className="text-green-600" title="موافقة"><CheckCircle size={16} /></Button>
                  <Button variant="ghost" size="icon" className="text-red-600" title="رفض"><XCircle size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
