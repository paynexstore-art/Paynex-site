"use client";

import React from "react";
import { SearchCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const checks = [
  { label: "العناوين والوصف", status: "مكتمل" },
  { label: "Structured Data", status: "مفعل" },
  { label: "خريطة الموقع", status: "جاهزة" },
  { label: "تحسين الصور", status: "قيد المتابعة" },
];

export default function SEOPanel() {
  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchCheck className="h-5 w-5 text-blue-600" />
          لوحة متابعة SEO
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {checks.map((check) => (
            <div key={check.label} className="rounded-lg border p-4">
              <div className="font-medium text-gray-800">{check.label}</div>
              <div className="mt-2 text-sm text-emerald-700">{check.status}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
