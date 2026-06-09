"use client";
import React from "react";
import { motion } from "framer-motion";
import { Heart, Star, Gift, Calendar } from "lucide-react";

const stats = [
  { label: "عميل سعيد", value: "+1,000,000", icon: <Heart className="text-red-500" /> },
  { label: "منتج متاح", value: "+1,000", icon: <Star className="text-yellow-500" /> },
  { label: "مقدم", value: "0%", icon: <Gift className="text-blue-500" /> },
  { label: "تقسيط حتى", value: "36 شهر", icon: <Calendar className="text-green-500" /> },
];

export default function StatsCounter() {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <h3 className="text-2xl md:text-3xl font-bold text-[#0A1628]">{stat.value}</h3>
              <p className="text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
