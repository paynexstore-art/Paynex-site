"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Users, Package, Settings, BarChart3, Shield, Wallet, History, LogOut } from "lucide-react";
import { getCurrentUser, clearCurrentUser } from "@/lib/auth";

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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Support both Supabase and custom local auth
    const currentUser = getCurrentUser();
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
      setUser(currentUser);
    } else {
      // If no valid admin, redirect to login
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    clearCurrentUser();
    // Also clear cookie if set
    document.cookie = 'paynex_custom_auth=; path=/; max-age=0';
    router.push('/login');
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-cairo">
      {/* Modern Sidebar - matching new UI style */}
      <aside className="w-64 bg-[#0A1628] text-white h-screen fixed right-0 top-0 overflow-y-auto z-50 shadow-2xl transition-all duration-300">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#C9A84C] rounded-2xl flex items-center justify-center">
            <span className="text-[#0A1628] font-bold text-xl">P</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#C9A84C]">Paynix</h1>
            <p className="text-[10px] text-white/60 -mt-1">لوحة التحكم</p>
          </div>
        </div>

        <div className="p-4 text-xs text-white/50 border-b border-gray-800">
          مرحباً، {user.name || 'المدير العام'}
        </div>

        <nav className="mt-2">
          {menuItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href}
              className="flex items-center gap-3 px-6 py-[13px] text-sm hover:bg-white/5 transition-colors border-r-4 border-transparent hover:border-[#C9A84C] active:bg-white/10"
            >
              <span className="text-[#C9A84C]">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white w-full"
          >
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow mr-64 p-8 transition-all duration-300">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0A1628]">لوحة تحكم Paynix</h2>
            <p className="text-sm text-gray-500">إدارة المنصة والتقسيط</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm border rounded-2xl hover:bg-gray-100">تنبيهات</button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-[#0A1628] text-white rounded-2xl flex items-center gap-2 hover:bg-black"
            >
              <LogOut size={16} /> خروج
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
