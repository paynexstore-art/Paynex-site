"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0A1628] border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            {/* Paynix SVG Logo */}
            <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="30" fontFamily="Arial" fontSize="28" fontWeight="bold" fill="#C9A84C">Paynix</text>
            </svg>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-white/80">
            <Link href="/" className="hover:text-[#C9A84C] transition-colors">الرئيسية</Link>
            <Link href="/products" className="hover:text-[#C9A84C] transition-colors">المنتجات</Link>
            <Link href="/calculator" className="hover:text-[#C9A84C] transition-colors">احسب قسطك</Link>
            <Link href="/contact" className="hover:text-[#C9A84C] transition-colors">تواصل معنا</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:text-[#C9A84C]">EN</Button>
          {user ? (
            <Link href={user.role === 'super_admin' ? '/secure-dashboard' : user.role === 'supervisor' ? '/supervisor' : '/orders'}>
              <Button className="bg-[#C9A84C] hover:bg-[#b09340] text-[#0A1628] font-bold">حسابي</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A1628]">تسجيل الدخول</Button>
            </Link>
          )}
          <Link href="/calculator" className="hidden sm:block">
            <Button className="bg-[#C9A84C] hover:bg-[#b09340] text-[#0A1628] font-bold">احسب قسطك</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
