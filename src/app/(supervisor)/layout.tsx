"use client";
import React from "react";
import Link from "next/link";
import { UserCheck, List, Wallet, Award, LogOut } from "lucide-react";

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0A1628] text-white font-cairo">
      {/* Sidebar for Supervisor */}
      <aside className="w-20 md:w-64 bg-[#111d2f] h-screen fixed right-0 top-0 z-50 flex flex-col items-center py-8 shadow-2xl">
        <div className="mb-12">
          <h1 className="hidden md:block text-2xl font-bold text-[#C9A84C]">باينكس</h1>
          <div className="md:hidden w-10 h-10 bg-[#C9A84C] rounded-full"></div>
        </div>
        
        <nav className="flex-grow space-y-6 w-full">
          {[
            { label: "الرئيسية", icon: <UserCheck size={20} />, href: "/supervisor/supervisor" },
            { label: "الطلبات", icon: <List size={20} />, href: "/supervisor/supervisor/orders" },
            { label: "المحفظة", icon: <Wallet size={20} />, href: "/supervisor/supervisor/wallet" },
            { label: "الأداء", icon: <Award size={20} />, href: "/supervisor/supervisor/performance" },
          ].map(item => (
            <Link key={item.label} href={item.href} className="flex items-center justify-center md:justify-start gap-4 px-6 py-3 hover:bg-white/5 transition-colors">
              <span className="text-[#C9A84C]">{item.icon}</span>
              <span className="hidden md:block font-bold">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button className="flex items-center justify-center md:justify-start gap-4 px-6 py-3 w-full text-red-400 hover:bg-red-400/10 transition-colors">
          <LogOut size={20} />
          <span className="hidden md:block font-bold">خروج</span>
        </button>
      </aside>

      <main className="flex-grow mr-20 md:mr-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
