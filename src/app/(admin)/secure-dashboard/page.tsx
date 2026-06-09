import React from "react";
import AnalyticsChart from "@/components/admin/AnalyticsChart";
import GeoMap from "@/components/admin/GeoMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, TrendingUp, DollarSign } from "lucide-react";

export default function AdminDashboardPage() {
  const kpis = [
    { title: "الطلبات اليوم", value: "45", icon: <ShoppingCart className="text-blue-500" /> },
    { title: "الطلبات الشهر", value: "1,200", icon: <TrendingUp className="text-green-500" /> },
    { title: "الإيرادات", value: "250,000 ج.م", icon: <DollarSign className="text-yellow-500" /> },
    { title: "العملاء الجدد", value: "+150", icon: <Users className="text-purple-500" /> },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalyticsChart />
        <Card>
          <CardHeader>
            <CardTitle>التوزيع الجغرافي</CardTitle>
          </CardHeader>
          <CardContent>
            <GeoMap />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Orders or other tables can go here */}
      </div>
    </div>
  );
}
