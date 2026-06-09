"use client";
import React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, PhoneCall } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OrderSuccessPage() {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <Card className="max-w-lg w-full text-center p-8">
        <CardContent className="space-y-8">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle2 size={40} />
          </motion.div>
          
          <div>
            <h2 className="text-2xl font-bold text-[#0A1628] mb-2">تم استلام طلبك بنجاح!</h2>
            <p className="text-gray-500">رقم الطلب الخاص بك هو: <span className="font-bold text-[#C9A84C]">PAY-2024-54321</span></p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl space-y-4">
            <div className="flex items-center gap-4 text-right">
              <Clock className="text-[#C9A84C] shrink-0" />
              <p className="text-sm">جاري التحقق من طلبك الآن من قبل المشرف المسؤول عن محافظتك.</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <PhoneCall className="text-[#C9A84C] shrink-0" />
              <p className="text-sm">سيتواصل معك المشرف خلال 24 ساعة لترتيب موعد الزيارة الميدانية واستلام المستندات.</p>
            </div>
          </div>

          <div className="p-4 border-2 border-dashed border-yellow-200 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            تنبيه: رسوم الاستعلام (100 ج.م) تدفع نقداً للمشرف عند الزيارة ورفع المستندات.
          </div>

          <div className="flex flex-col gap-4">
            <Link href={`/orders/${id}`}>
              <Button className="w-full bg-[#0A1628]">تتبع حالة الطلب</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">العودة للرئيسية</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
