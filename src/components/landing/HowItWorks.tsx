"use client";
import React from "react";
import { motion } from "framer-motion";
import { Search, Send, ShieldCheck, Truck } from "lucide-react";

const steps = [
  { title: "اختر المنتج", desc: "تصفح مئات المنتجات واختر ما يناسبك", icon: <Search className="w-8 h-8" /> },
  { title: "قدّم طلبك", desc: "املأ بياناتك بسهولة وفي دقائق معدودة", icon: <Send className="w-8 h-8" /> },
  { title: "راجع المدير", desc: "سيتم مراجعة طلبك والموافقة عليه سريعاً", icon: <ShieldCheck className="w-8 h-8" /> },
  { title: "استلم منتجك", desc: "استلم المنتج وابدأ في دفع الأقساط المريحة", icon: <Truck className="w-8 h-8" /> },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-[#0A1628] mb-16">كيف يعمل باينكس؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-[#0A1628] rounded-full flex items-center justify-center text-[#C9A84C] mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg border-4 border-white">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0A1628] mb-2">{step.title}</h3>
              <p className="text-gray-500">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
