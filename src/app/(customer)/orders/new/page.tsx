"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { calculateInstallment } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";

const orderSchema = z.object({
  fullName: z.string().min(3, "الاسم مطلوب"),
  email: z.string().email("بريد غير صحيح"),
  phone: z.string().min(11, "رقم الهاتف غير صحيح"),
  nationalId: z.string().length(14, "الرقم القومي يجب أن يكون 14 رقم"),
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  address: z.string().min(10, "العنوان التفصيلي مطلوب"),
  job: z.string().min(3, "الوظيفة مطلوبة"),
  downPayment: z.number().min(0),
  months: z.number().min(3).max(36),
});

export default function OrderFormPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      downPayment: 0,
      months: 12,
    }
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // 1. Create Order in Supabase
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_number: `PAY-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
          customer_name: data.fullName,
          customer_phone: data.phone,
          customer_national_id: data.nationalId, // In real app, encrypt this
          customer_governorate: data.governorate,
          customer_address: data.address,
          customer_job: data.job,
          product_id: productId,
          down_payment: data.downPayment,
          months: data.months,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/orders/${order.id}/success`);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تقديم الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-8 flex justify-between">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`w-1/3 h-2 rounded-full mx-1 ${step >= s ? 'bg-[#C9A84C]' : 'bg-gray-200'}`}></div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-xl font-bold mb-4">البيانات الشخصية</h3>
                  <Input {...register("fullName")} placeholder="الاسم الكامل" />
                  {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message as string}</p>}
                  <Input {...register("email")} placeholder="البريد الإلكتروني" />
                  <Input {...register("phone")} placeholder="رقم الهاتف" />
                  <Input {...register("nationalId")} placeholder="الرقم القومي" />
                  <Input {...register("governorate")} placeholder="المحافظة" />
                  <Input {...register("address")} placeholder="العنوان بالتفصيل" />
                  <Input {...register("job")} placeholder="الوظيفة" />
                  <Button type="button" onClick={nextStep} className="w-full bg-[#0A1628]">التالي</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-xl font-bold mb-4">تفاصيل التقسيط</h3>
                  <div>
                    <label className="text-sm">المقدم</label>
                    <Input type="number" {...register("downPayment", { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="text-sm">مدة التقسيط (أشهر)</label>
                    <Input type="number" {...register("months", { valueAsNumber: true })} />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">القسط الشهري التقريبي:</p>
                    <p className="text-2xl font-bold text-[#10B981]">محسوب بناء على السعر</p>
                  </div>
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="w-full">السابق</Button>
                    <Button type="button" onClick={nextStep} className="w-full bg-[#0A1628]">التالي</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-xl font-bold mb-4">مراجعة الطلب</h3>
                  <div className="space-y-2 text-sm">
                    <p>الاسم: {watch("fullName")}</p>
                    <p>المحافظة: {watch("governorate")}</p>
                    <p>المدة: {watch("months")} شهر</p>
                  </div>
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
                    تطبق رسوم استعلام تدفع للمشرف عند الزيارة.
                  </div>
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="w-full">السابق</Button>
                    <Button type="submit" disabled={loading} className="w-full bg-[#C9A84C] text-[#0A1628] font-bold">
                      {loading ? "جاري الإرسال..." : "تأكيد الطلب"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
