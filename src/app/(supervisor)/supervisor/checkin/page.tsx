"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin, Camera, CheckCircle2 } from "lucide-react";
import { verifyLocation } from "@/lib/geofencing";

export default function SupervisorCheckIn() {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGPSVerify = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
        setStep(2);
      });
    } else {
      alert("GPS غير مدعوم في هذا المتصفح");
      setLoading(false);
    }
  };

  const handleFaceVerify = () => {
    setLoading(true);
    // Simulate face verification delay
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 2000);
  };

  const handleCheckIn = () => {
    alert("تم تسجيل الحضور بنجاح!");
    // Update DB status
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="bg-[#111d2f] border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-center">تسجيل الحضور اليومي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 py-6">
          <div className="flex justify-between relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-[#C9A84C] bg-[#C9A84C] text-[#0A1628]' : 'border-gray-600 text-gray-400'}`}>1</div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-[#C9A84C] bg-[#C9A84C] text-[#0A1628]' : 'border-gray-600 text-gray-400'}`}>2</div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-[#C9A84C] bg-[#C9A84C] text-[#0A1628]' : 'border-gray-600 text-gray-400'}`}>3</div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                <MapPin size={64} className="mx-auto text-[#00D4FF]" />
                <p>يجب التحقق من موقعك الجغرافي داخل نطاق المحافظة المكلف بها.</p>
                <Button onClick={handleGPSVerify} disabled={loading} className="w-full bg-[#C9A84C] text-[#0A1628] font-bold">
                  {loading ? "جاري التحديد..." : "تحقق من الموقع"}
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                <Camera size={64} className="mx-auto text-[#00D4FF]" />
                <p>يرجى التقاط صورة واضحة لوجهك للتحقق البيومتري.</p>
                <div className="w-48 h-48 bg-black rounded-lg mx-auto border-2 border-dashed border-gray-600"></div>
                <Button onClick={handleFaceVerify} disabled={loading} className="w-full bg-[#C9A84C] text-[#0A1628] font-bold">
                  {loading ? "جاري التحقق..." : "التقط الصورة"}
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                <CheckCircle2 size={64} className="mx-auto text-[#10B981]" />
                <p className="text-xl font-bold">كل شيء جاهز!</p>
                <div className="text-sm text-gray-400">
                  الموقع: تم التحقق ✅<br />
                  الوجه: تم التحقق ✅
                </div>
                <Button onClick={handleCheckIn} className="w-full bg-[#10B981] hover:bg-[#0da070] text-white font-bold">
                  بدء العمل
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
