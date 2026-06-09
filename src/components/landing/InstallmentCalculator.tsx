"use client";
import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { calculateInstallment } from "@/lib/pricing";

export default function InstallmentCalculator() {
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(12);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    try {
      const pricing = calculateInstallment({
        productPrice: amount,
        months: months,
        interestRate: 0.25,
        adminFee: 150,
        inquiryFee: 100
      });
      setResult(pricing);
    } catch (e) {
      console.error(e);
    }
  }, [amount, months]);

  return (
    <section className="py-20 bg-gradient-to-br from-[#0A1628] to-[#1a2744] text-white overflow-hidden">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-3xl font-bold mb-12 text-center text-[#C9A84C]">احسب قسطك بسهولة</h2>
        
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-10">
              <div>
                <div className="flex justify-between mb-4">
                  <label className="text-lg">مبلغ المنتج</label>
                  <span className="text-[#C9A84C] font-bold text-xl">{amount} ج.م</span>
                </div>
                <Slider 
                  value={[amount]} 
                  onValueChange={(v) => setAmount(v[0])} 
                  max={100000} 
                  step={500}
                  className="py-4"
                />
              </div>

              <div>
                <div className="flex justify-between mb-4">
                  <label className="text-lg">مدة التقسيط</label>
                  <span className="text-[#C9A84C] font-bold text-xl">{months} شهر</span>
                </div>
                <Slider 
                  value={[months]} 
                  onValueChange={(v) => setMonths(v[0])} 
                  min={3} 
                  max={36} 
                  step={3}
                  className="py-4"
                />
              </div>
            </div>

            <div className="bg-[#C9A84C] rounded-2xl p-8 text-[#0A1628] text-center space-y-4 shadow-xl transform hover:scale-105 transition-transform">
              <p className="text-lg opacity-80">القسط الشهري المتوقع</p>
              <h3 className="text-5xl font-black">{result?.monthlyInstallment || 0} ج.م</h3>
              <div className="pt-4 border-t border-[#0A1628]/10 text-sm space-y-1 opacity-70">
                <p>إجمالي المبلغ: {result?.totalAmount} ج.م</p>
                <p>مقدم: 0 ج.م</p>
                <p>رسوم إدارية واستعلام: 250 ج.م</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
