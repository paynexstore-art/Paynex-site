"use client";

import React from "react";
import { MapPin } from "lucide-react";

const regions = [
  { city: "القاهرة", percentage: 42, color: "bg-blue-500" },
  { city: "الجيزة", percentage: 24, color: "bg-emerald-500" },
  { city: "الإسكندرية", percentage: 18, color: "bg-amber-500" },
  { city: "الدلتا", percentage: 10, color: "bg-purple-500" },
  { city: "الصعيد", percentage: 6, color: "bg-rose-500" },
];

export default function GeoMap() {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm" dir="rtl">
      <div className="mb-5 flex items-center gap-2 text-[#0A1628]">
        <MapPin className="h-5 w-5 text-[#C9A84C]" />
        <h3 className="font-semibold">أعلى المحافظات حسب الطلبات</h3>
      </div>

      <div className="space-y-4">
        {regions.map((region) => (
          <div key={region.city}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{region.city}</span>
              <span className="text-gray-500">{region.percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${region.color}`}
                style={{ width: `${region.percentage}%` }}
                aria-label={`${region.city}: ${region.percentage}%`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        الخريطة التفصيلية يمكن ربطها لاحقًا ببيانات الطلبات الحقيقية من Supabase أو قاعدة البيانات.
      </div>
    </div>
  );
}
