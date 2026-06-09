"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ y: 100 }} 
          animate={{ y: 0 }} 
          exit={{ y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:w-96"
        >
          <div className="bg-[#0A1628] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center text-[#0A1628]">
                <Smartphone />
              </div>
              <div>
                <p className="font-bold text-sm">تطبيق باينكس على هاتفك</p>
                <p className="text-[10px] text-gray-400">تابع أقساطك وطلباتك بسهولة</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleInstall} size="sm" className="bg-[#C9A84C] text-[#0A1628] font-bold h-8 text-[10px]">تثبيت الآن</Button>
              <button onClick={() => setShow(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
