"use client";
import React from "react";
import AnalyticsChart from "@/components/admin/AnalyticsChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: "مقبول", value: 70 },
  { name: "مرفوض", value: 15 },
  { name: "تحت المراجعة", value: 15 },
];
const COLORS = ["#10B981", "#EF4444", "#F59E0B"];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">التحليلات والإحصائيات</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalyticsChart />
        <Card>
          <CardHeader>
            <CardTitle>نسبة قبول الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
