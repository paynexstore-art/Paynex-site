"use client";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-[#0A1628] to-[#1a2744] overflow-hidden">
      {/* Particles effect placeholder */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#00D4FF] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#C9A84C] rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 text-white text-center md:text-right"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            التقسيط الذكي <span className="text-[#C9A84C]">للجيل القادم</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
            اشترِ الآن وادفع بالطريقة التي تناسبك مع باينكس. أسرع منصة تقسيط في مصر.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link href="/products">
              <Button className="bg-[#C9A84C] hover:bg-[#b09340] text-[#0A1628] text-lg px-8 py-6 font-bold w-full sm:w-auto">
                تسوق الآن
              </Button>
            </Link>
            <Link href="/calculator">
              <Button variant="outline" className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A1628] text-lg px-8 py-6 font-bold w-full sm:w-auto">
                احسب قسطك
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="md:w-1/2 mt-12 md:mt-0 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#C9A84C]/20 rounded-2xl blur-2xl transform rotate-6"></div>
            <img 
              src="/images/hero-electronics.png" 
              alt="Electronics" 
              className="relative rounded-2xl shadow-2xl max-w-full h-auto border border-gray-700"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/0A1628/C9A84C?text=Paynix+FinTech' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
