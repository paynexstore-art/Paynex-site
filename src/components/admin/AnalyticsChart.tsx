"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { month: "يناير", orders: 320, revenue: 42000 },
  { month: "فبراير", orders: 410, revenue: 53000 },
  { month: "مارس", orders: 560, revenue: 71000 },
  { month: "أبريل", orders: 620, revenue: 88000 },
  { month: "مايو", orders: 760, revenue: 109000 },
  { month: "يونيو", orders: 840, revenue: 126000 },
];

export default function AnalyticsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>نمو الطلبات والإيرادات</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0A1628" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0A1628" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => value.toLocaleString("ar-EG")} />
            <Area
              type="monotone"
              dataKey="orders"
              name="الطلبات"
              stroke="#0A1628"
              fillOpacity={1}
              fill="url(#ordersGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
