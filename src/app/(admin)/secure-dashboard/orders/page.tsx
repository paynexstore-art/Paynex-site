"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Eye, CheckCircle, XCircle, ShoppingCart, Clock, Check, AlertCircle, Filter } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, loading: true });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select(`*, product:products(*)`)
          .order('created_at', { ascending: false });
        
        if (data) {
          setOrders(data);
          setStats({
            total: data.length,
            pending: data.filter(o => o.status === 'pending').length,
            approved: data.filter(o => o.status === 'approved' || o.status === 'delivered').length,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { label: "قيد الانتظار", color: "bg-gray-100 text-gray-700", icon: <Clock size={12} /> },
      under_inquiry: { label: "جاري الاستعلام", color: "bg-yellow-100 text-yellow-700", icon: <AlertCircle size={12} /> },
      admin_review: { label: "مراجعة الإدارة", color: "bg-blue-100 text-blue-700", icon: <Filter size={12} /> },
      approved: { label: "تمت الموافقة", color: "bg-green-100 text-green-700", icon: <Check size={12} /> },
      rejected: { label: "مرفوض", color: "bg-red-100 text-red-700", icon: <XCircle size={12} /> },
      delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle size={12} /> },
    };
    const s = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700", icon: null };
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold w-fit ${s.color}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  if (stats.loading) return <div className="p-8 text-center">جاري تحميل الطلبات...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-[#0A1628]">إدارة الطلبات الذكية</h2>
        <p className="text-muted-foreground">متابعة دقيقة لجميع طلبات التقسيط وحالاتها</p>
      </div>

      {/* Orders KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
            <ShoppingCart className="text-blue-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات معلقة</CardTitle>
            <Clock className="text-yellow-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات مكتملة</CardTitle>
            <CheckCircle className="text-green-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold text-[#0A1628]">رقم الطلب</TableHead>
              <TableHead className="font-bold text-[#0A1628]">العميل</TableHead>
              <TableHead className="font-bold text-[#0A1628]">المنتج</TableHead>
              <TableHead className="font-bold text-[#0A1628]">المحافظة</TableHead>
              <TableHead className="font-bold text-[#0A1628]">الحالة</TableHead>
              <TableHead className="font-bold text-[#0A1628] text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد طلبات متاحة حالياً</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-bold text-indigo-600">#{order.order_number || order.orderNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.customer_name || order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.customer_phone || order.customerPhone}</div>
                  </TableCell>
                  <TableCell>{order.product?.name_ar || order.product?.nameAr || "منتج غير محدد"}</TableCell>
                  <TableCell>{order.customer_governorate || order.customerGovernorate}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" title="التفاصيل">
                      <Eye size={14} /> عرض
                    </Button>
                    <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50" title="موافقة"><CheckCircle size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" title="رفض"><XCircle size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
