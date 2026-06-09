"use client";
import React from "react";
import { motion } from "framer-motion";

const brands = [
  "Samsung", "Apple", "Huawei", "Xiaomi", "LG", "Sony", "Dell", "HP", 
  "Lenovo", "Asus", "Toshiba", "Hisense", "TCL", "Oppo", "Realme", 
  "OnePlus", "Nokia", "Philips", "Sharp", "Panasonic"
];

export default function BrandsMarquee() {
  return (
    <div className="py-12 bg-white overflow-hidden border-y border-gray-50">
      <div className="flex gap-12 animate-scroll">
        {[...brands, ...brands].map((brand, i) => (
          <div key={i} className="flex-shrink-0 text-2xl font-black text-gray-200 hover:text-[#C9A84C] transition-colors px-4 cursor-default">
            {brand}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          width: max-content;
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
