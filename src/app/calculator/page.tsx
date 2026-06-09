"use client";

import React from "react";
import InstallmentCalculator from "@/components/landing/InstallmentCalculator";

export default function CalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-[#0A1628]">احسب قسطك</h1>
        <p className="text-center text-gray-600 mb-10">اختر المنتج أو أدخل السعر لحساب التقسيط الشهري</p>
        
        <InstallmentCalculator />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          الحساب تقريبي. الشروط النهائية حسب الموافقة الائتمانية ورسوم الاستعلام.
        </div>
      </div>
    </div>
  );
}
