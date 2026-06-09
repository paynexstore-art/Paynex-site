"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/products", label: "المنتجات" },
    { href: "/calculator", label: "احسب قسطك" },
    { href: "/contact", label: "تواصل معنا" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0A1628] border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-[#C9A84C] tracking-tight">Paynix</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7 text-sm text-white/80">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#C9A84C] transition-colors font-medium">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-white hover:text-[#C9A84C] hidden sm:flex text-sm">EN</Button>

          {user ? (
            <Link href={user.role === 'super_admin' || user.role === 'admin' ? '/secure-dashboard' : user.role === 'supervisor' ? '/supervisor' : '/orders/new'}>
              <Button className="bg-[#C9A84C] hover:bg-[#b09340] text-[#0A1628] font-semibold text-sm px-5">حسابي</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A1628] text-sm px-5">تسجيل الدخول</Button>
            </Link>
          )}

          <Link href="/calculator" className="hidden sm:block">
            <Button className="bg-[#C9A84C] hover:bg-[#b09340] text-[#0A1628] font-semibold text-sm px-5">احسب قسطك</Button>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-[#0A1628] px-4 py-4 text-white/90 text-sm">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="py-1 hover:text-[#C9A84C]" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-700 flex flex-col gap-2">
              {!user && (
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full border-[#C9A84C] text-[#C9A84C]">تسجيل الدخول</Button>
                </Link>
              )}
              <Link href="/calculator" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[#C9A84C] text-[#0A1628]">احسب قسطك</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
