import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0A1628] text-white pt-16 pb-8 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="30" fontFamily="Arial" fontSize="28" fontWeight="bold" fill="#C9A84C">Paynix</text>
            </svg>
            <p className="text-gray-400">
              باينكس هي منصة التقسيط الذكي الرائدة في مصر، نسعى لتسهيل حياة المواطنين عبر حلول تمويلية مرنة وسريعة.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-6 text-[#C9A84C]">روابط سريعة</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">الرئيسية</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">المنتجات</Link></li>
              <li><Link href="/calculator" className="hover:text-white transition-colors">احسب قسطك</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-[#C9A84C]">قانوني</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-[#C9A84C]">تواصل معنا</h4>
            <div className="space-y-4 text-gray-400">
              <p>واتساب: 010XXXXXXXX</p>
              <p>البريد: support@paynix.com</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2024 Paynix. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span>Facebook</span>
            <span>Instagram</span>
            <span>Twitter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
