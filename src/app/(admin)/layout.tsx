"use client";
import React from "react";
import Link from "next/link";
import { LayoutDashboard, ShoppingCart, Users, Package, Settings, BarChart3, Shield, Wallet, History, CreditCard } from "lucide-react";

const menuItems = [
  { label: "الرئيسية", icon: <LayoutDashboard size={20} />, href: "/secure-dashboard" },
  { label: "الطلبات", icon: <ShoppingCart size={20} />, href: "/secure-dashboard/orders" },
  { label: "المشرفين", icon: <Users size={20} />, href: "/secure-dashboard/supervisors" },
  { label: "العملاء", icon: <Shield size={20} />, href: "/secure-dashboard/customers" },
  { label: "المنتجات", icon: <Package size={20} />, href: "/secure-dashboard/products" },
  { label: "المالية", icon: <Wallet size={20} />, href: "/secure-dashboard/financial" },
  { label: "التحليلات", icon: <BarChart3 size={20} />, href: "/secure-dashboard/analytics" },
  { label: "إعدادات الموقع", icon: <Settings size={20} />, href: "/secure-dashboard/site-settings" },
  { label: "سجل العمليات", icon: <History size={20} />, href: "/secure-dashboard/audit-logs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 font-cairo">
      {/* Fixed Sidebar on the Right */}
      <aside className="w-64 bg-[#0A1628] text-white h-screen fixed right-0 top-0 overflow-y-auto z-50">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-[#C9A84C]">لوحة تحكم Paynix</h1>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href}
              className="flex items-center gap-4 px-6 py-4 hover:bg-white/10 transition-colors border-r-4 border-transparent hover:border-[#C9A84C]"
            >
              {item.icon}
              <span className="font-bold">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow mr-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#0A1628]">مرحباً، المدير العام</h2>
          <div className="flex gap-4">
            <Button variant="outline">تنبيهات</Button>
            <Button variant="ghost">خروج</Button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

// Dummy Button for the example
function Button({ children, variant }: any) {
  return <button className={`px-4 py-2 rounded ${variant === 'outline' ? 'border' : ''}`}>{children}</button>;
}
