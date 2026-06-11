"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, PieChart, Landmark, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function FinancialDashboardPage() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    activeLoans: 0,
    monthlyProfit: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchFinancials() {
      try {
        // In a real app, these would be aggregated queries (sum, count)
        const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { data: configs } = await supabase.from('financial_config').select('*');
        
        // Mock calculation for summary
        setSummary({
          totalRevenue: (ordersCount || 0) * 2500, // Avg price
          pendingPayments: Math.floor((ordersCount || 0) * 0.3),
          activeLoans: ordersCount || 0,
          monthlyProfit: (ordersCount || 0) * 150,
          loading: false,
        });
      } catch (err) {
        console.error("Financial fetch error:", err);
        setSummary(prev => ({ ...prev, loading: false }));
      }
    }
    fetchFinancials();
  }, []);

  if (summary.loading) return <div className="p-8 text-center">جاري تحميل البيانات المالية...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0A1628]">الإدارة المالية</h1>
        <p className="text-muted-foreground">مراقبة التدفقات النقدية والرواتب والإعدادات المالية</p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialCard title="إجمالي الإيرادات" value={`${summary.totalRevenue.toLocaleString()} ج.م`} icon={<Landmark className="text-green-600" />} trend="+15% شهرياً" />
        <FinancialCard title="قروض نشطة" value={summary.activeLoans} icon={<Wallet className="text-blue-600" />} trend="مستقر" />
        <FinancialCard title="مدفوعات معلقة" value={summary.pendingPayments} icon={<TrendingUp className="text-yellow-600" />} trend="-5% تحسن" />
        <FinancialCard title="صافي الربح الشهري" value={`${summary.monthlyProfit.toLocaleString()} ج.م`} icon={<PieChart className="text-purple-600" />} trend="+8% نمو" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Links to Sub-pages */}
        <Card className="border-2 border-indigo-500/20 hover:border-indigo-500/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">إعدادات الرسوم والعمولات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">تحكم في نسب الفائدة، رسوم الإدارة، ورسوم الاستعلام لجميع الطلبات الجديدة.</p>
            <Link href="/admin/secure-dashboard/financial/config">
              <Button className="w-full bg-[#0A1628] hover:bg-black gap-2">
                فتح الإعدادات المالية <ArrowUpRight size={16} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-500/20 hover:border-emerald-500/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">إدارة الرواتب والمكافآت</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">مراجعة كشوف رواتب المشرفين، إضافة المكافآت، وخصم الغرامات المالية.</p>
            <Link href="/admin/secure-dashboard/financial/payroll">
              <Button className="w-full bg-emerald-700 hover:bg-emerald-800 gap-2 text-white">
                إدارة مسيرات الرواتب <ArrowUpRight size={16} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table Mockup */}
      <Card>
        <CardHeader>
          <CardTitle>آخر العمليات المالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>سيتم عرض سجل التحويلات المالية التفصيلي هنا قريباً</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialCard({ title, value, icon, trend }: { title: string, value: any, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-green-600 font-medium">{trend}</p>
      </CardContent>
    </Card>
  );
}
