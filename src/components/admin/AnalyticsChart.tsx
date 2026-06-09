"use client";
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "يناير", orders: 400 },
  { name: "فبراير", orders: 600 },
  { name: "مارس", orders: 800 },
  { name: "أبريل", orders: 1200 },
  { name: "مايو", orders: 1500 },
  { name: "يونيو", orders: 2000 },
];

export default function AnalyticsChart() {
  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-bold mb-4">نمو الطلبات</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="orders" stroke="#C9A84C" strokeWidth={3} dot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
