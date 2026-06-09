"use client";
import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  { name: 'أحمد محمد', content: 'خدمة ممتازة وتقسيط مريح جداً' },
  { name: 'فاطمة علي', content: 'أفضل موقع تقسيط في مصر بدون مبالغة' },
  { name: 'محمود حسن', content: 'سهل وسريع ومحترم في التعامل' },
  { name: 'نور الهدى', content: 'استلمت منتجي في أسرع وقت' },
  { name: 'كريم سامي', content: 'الأقساط مناسبة جداً لإمكانياتي' },
  // ... more would go here
];

export default function TestimonialsMarquee() {
  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 mb-12 text-center">
        <h2 className="text-3xl font-bold text-[#0A1628]">آراء عملائنا</h2>
      </div>
      <div className="flex gap-6 animate-scroll-reverse">
        {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
          <div key={i} className="flex-shrink-0 w-80 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-gray-600 mb-4 h-12 line-clamp-2">{t.content}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A1628] to-[#C9A84C]"></div>
              <span className="font-bold text-[#0A1628]">{t.name}</span>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll-reverse {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .animate-scroll-reverse {
          display: flex;
          width: max-content;
          animation: scroll-reverse 40s linear infinite;
        }
      `}</style>
    </section>
  );
}
