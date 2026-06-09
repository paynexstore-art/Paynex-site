"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, Wallet, Award, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SupervisorDashboardPage() {
  const stats = [
    { title: "طلبات بانتظار الزيارة", value: "8", icon: <List className="text-blue-400" /> },
    { title: "طلبات مكتملة (الشهر)", value: "125", icon: <CheckCircle className="text-green-400" /> },
    { title: "المديونية الحالية", value: "1,250 ج.م", icon: <Wallet className="text-red-400" /> },
    { title: "المكافأة المتوقعة", value: "450 ج.م", icon: <Award className="text-yellow-400" /> },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">لوحة المشرف الميداني</h2>
          <p className="text-gray-400 text-sm">أهلاً بك، محافظة القاهرة</p>
        </div>
        <Link href="/supervisor/checkin">
          <Button className="bg-[#C9A84C] text-[#0A1628] font-bold">تسجيل الحضور اليومي</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.title} className="bg-[#111d2f] border-gray-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{s.title}</CardTitle>
              {s.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-[#111d2f] border-gray-800 text-white">
          <CardHeader>
            <CardTitle>المهام الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-[#0A1628] rounded-lg border border-gray-700">
                  <div>
                    <p className="font-bold">محمد أحمد علي</p>
                    <p className="text-xs text-gray-400">القاهرة، مدينة نصر</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-[#C9A84C] text-[#C9A84C]">عرض الطلب</Button>
                </div>
              ))}
            </div>
            <Button variant="link" className="w-full mt-4 text-[#C9A84C]">عرض كل الطلبات</Button>
          </CardContent>
        </Card>

        <Card className="bg-[#111d2f] border-gray-800 text-white">
          <CardHeader>
            <CardTitle>التارجت الشهري</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>تم إنجاز 125 من 1500 طلب</span>
                <span className="text-[#C9A84C]">8%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#C9A84C]" style={{ width: '8%' }}></div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              باقي 1375 طلب للحصول على مكافأة بقيمة <span className="text-[#C9A84C] font-bold">3000 جنيه</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
