"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, ShoppingCart, Heart, User, Download, Phone, 
  CreditCard, Zap, Gamepad2, Wallet, ArrowRight 
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';

// Sample high-quality products (realistic for E-commerce + Fintech)
const flashSaleProducts = [
  {
    id: "p1",
    name: "سامسونج جالاكسي A55 5G",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop",
    originalPrice: 18999,
    displayPrice: 15999,
    installmentText: "قسط من ١٣٣٣ جنيه/شهر"
  },
  {
    id: "p2",
    name: "آيفون 15 برو ماكس",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=600&fit=crop",
    originalPrice: 54999,
    displayPrice: 48999,
    installmentText: "قسط من ٤٠٨٣ جنيه/شهر"
  },
  {
    id: "p3",
    name: "لابتوب لينوفو IdeaPad Gaming",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop",
    originalPrice: 32500,
    displayPrice: 27999,
    installmentText: "قسط من ٢٣٣٣ جنيه/شهر"
  },
];

const bestPhones = [
  { id: "p4", name: "سامسونج جالاكسي S24", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop", originalPrice: 32999, displayPrice: 29999, installmentText: "قسط من ٢٤٩٩ جنيه/شهر" },
  { id: "p5", name: "آيفون 16", image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=600&fit=crop", originalPrice: 44999, displayPrice: 41999, installmentText: "قسط من ٣٤٩٩ جنيه/شهر" },
];

const kitchenAppliances = [
  { id: "p6", name: "غسالة LG 9 كجم", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop", originalPrice: 18999, displayPrice: 16499, installmentText: "قسط من ١٣٧٤ جنيه/شهر" },
  { id: "p7", name: "ثلاجة توشيبا ٣١٨ لتر", image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&h=600&fit=crop", originalPrice: 24500, displayPrice: 21500, installmentText: "قسط من ١٧٩١ جنيه/شهر" },
];

export default function PaynexHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  // Hero Carousel
  const heroSlides = [
    {
      title: "عروض التقسيط الكبرى",
      subtitle: "اشترِ الآن وادفع على ٢٤ شهر بدون فوائد",
      cta: "تسوق العروض",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&h=600&fit=crop",
      badge: "حتى ٥٠٪ خصم"
    },
    {
      title: "آيفون ١٦ و ١٥ برو",
      subtitle: "قسط من ٣٤٩٩ جنيه شهرياً فقط",
      cta: "اكتشف الآيفون",
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1400&h=600&fit=crop",
      badge: "عرض محدود"
    },
  ];

  // Auto slide for Hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Flash Sale Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) return { hours: 0, minutes: 0, seconds: 0 };
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0A1628]" dir="rtl">
      {/* 1. Top Bar */}
      <div className="bg-[#0A1628] text-white text-xs py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="#" className="flex items-center gap-1.5 hover:text-[#C9A84C] transition-colors">
              <Download size={14} /> حمل تطبيق Paynex
            </a>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Phone size={13} /> خدمة العملاء: ١٩٩٩٩
          </div>
        </div>
      </div>

      {/* 2. Main Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo (RTL - Right side) */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#0A1628] rounded-2xl flex items-center justify-center">
                <span className="text-[#C9A84C] font-bold text-2xl">P</span>
              </div>
              <span className="font-bold text-2xl tracking-tighter text-[#0A1628]">Paynex</span>
            </Link>

            {/* Search Bar - Wide and Centered */}
            <div className="flex-1 max-w-2xl hidden md:block mx-6">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="ابحث عن موبايل، لابتوب، غسالة..." 
                  className="w-full bg-gray-100 border border-gray-200 focus:border-[#C9A84C] pl-12 pr-5 py-3 rounded-3xl text-sm placeholder:text-gray-500 focus:outline-none transition-all"
                />
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            {/* Right Side Icons (in RTL this is left visually) */}
            <div className="flex items-center gap-1 md:gap-2">
              <Link href="/products" className="hidden md:flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-2xl text-[#0A1628]">
                <Heart size={20} />
              </Link>
              
              <Link href="/orders/new" className="relative flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-2xl text-[#0A1628]">
                <ShoppingCart size={20} />
                <span className="absolute -top-0.5 -right-0.5 bg-[#F97316] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">3</span>
              </Link>

              <Link href="/login" className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-2xl text-[#0A1628]">
                <User size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="border-t bg-white">
          <div className="container mx-auto px-4 overflow-x-auto">
            <div className="flex items-center gap-x-8 text-sm py-3 text-[#0A1628]/80 font-medium whitespace-nowrap">
              <Link href="/products" className="hover:text-[#0A1628] transition-colors flex items-center gap-1">كل الفئات <ArrowRight size={14} /></Link>
              <Link href="/products" className="hover:text-[#F97316] transition-colors font-semibold">عروض اليوم</Link>
              <Link href="/products" className="hover:text-[#0A1628]">موبايلات</Link>
              <Link href="/products" className="hover:text-[#0A1628]">أجهزة منزلية</Link>
              <Link href="/products" className="hover:text-[#0A1628]">إلكترونيات</Link>
              <Link href="/calculator" className="hover:text-[#0A1628]">خدمات التقسيط</Link>
              <Link href="/contact" className="hover:text-[#0A1628]">دفع الفواتير</Link>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Hero Carousel */}
      <div className="relative h-[520px] md:h-[580px] overflow-hidden bg-[#0A1628]">
        {heroSlides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover brightness-[0.65]" 
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/30 to-transparent" />
            
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4 md:px-8">
                <div className="max-w-lg space-y-4 text-white">
                  <div className="inline-block bg-[#F97316] text-white text-xs font-bold tracking-wider px-4 py-1.5 rounded-full mb-1">
                    {slide.badge}
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold leading-none tracking-tighter">
                    {slide.title}
                  </h1>
                  <p className="text-xl text-white/90 max-w-md">{slide.subtitle}</p>
                  
                  <Link href="/products">
                    <button className="mt-4 bg-white text-[#0A1628] hover:bg-[#C9A84C] hover:text-white font-bold px-9 py-3.5 rounded-3xl text-base transition-all active:scale-[0.985] shadow-xl flex items-center gap-2">
                      {slide.cta} <ArrowRight size={18} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Dots */}
        <div className="absolute bottom-6 left-1/2 flex gap-2 -translate-x-1/2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-white w-7' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* 4. Quick Services - Aman Style */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6 text-center md:text-right">خدمات Paynex السريعة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <CreditCard size={28} />, label: "قدم على التقسيط", href: "/calculator" },
              { icon: <Zap size={28} />, label: "دفع الفواتير", href: "/contact" },
              { icon: <Wallet size={28} />, label: "شحن الرصيد", href: "/contact" },
              { icon: <Gamepad2 size={28} />, label: "كروت الألعاب", href: "/products" },
            ].map((service, idx) => (
              <Link 
                key={idx} 
                href={service.href}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-gray-50 hover:bg-[#F97316]/5 active:bg-[#F97316]/10 transition-all border border-transparent hover:border-[#F97316]/20 group"
              >
                <div className="text-[#0A1628] group-hover:text-[#F97316] transition-colors">
                  {service.icon}
                </div>
                <span className="font-semibold text-sm text-center text-[#0A1628]">{service.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Flash Sales */}
      <div className="container mx-auto px-4 pt-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[#F97316] font-bold text-sm tracking-widest">عروض محدودة</span>
            <h2 className="text-3xl font-bold">عروض الفلاش</h2>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-2xl border">
            <span className="text-gray-500">ينتهي العرض خلال</span>
            <span className="font-mono font-semibold text-[#F97316]">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
          {flashSaleProducts.map((product) => (
            <div key={product.id} className="snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>

      {/* 6. Category Grids */}
      <div className="container mx-auto px-4 py-10 space-y-14">
        {/* Best Phones */}
        <div>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-2xl font-bold">أفضل الهواتف الذكية</h2>
            <Link href="/products" className="text-sm font-medium text-[#F97316] flex items-center gap-1 hover:underline">
              شاهد الكل <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {bestPhones.map(p => <ProductCard key={p.id} {...p} />)}
          </div>
        </div>

        {/* Kitchen Appliances */}
        <div>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-2xl font-bold">أجهزة المطبخ</h2>
            <Link href="/products" className="text-sm font-medium text-[#F97316] flex items-center gap-1 hover:underline">
              شاهد الكل <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {kitchenAppliances.map(p => <ProductCard key={p.id} {...p} />)}
          </div>
        </div>
      </div>

      {/* 7. Trust Badges */}
      <div className="bg-white border-y py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 text-center text-sm">
            {[
              { icon: "🚚", text: "توصيل سريع خلال ٢٤ ساعة" },
              { icon: "🔒", text: "دفع آمن ١٠٠٪" },
              { icon: "💳", text: "تقسيط مريح بدون فوائد" },
              { icon: "↩️", text: "إرجاع مجاني خلال ١٤ يوم" },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center justify-center gap-2.5 text-[#0A1628]/80 font-medium">
                <span className="text-2xl">{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8. Footer */}
      <footer className="bg-[#0A1628] text-white/90 pt-12 pb-6 text-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 mb-10">
            <div>
              <h4 className="font-semibold text-white mb-3">Paynex</h4>
              <ul className="space-y-1.5 text-white/70">
                <li><a href="#">عن الشركة</a></li>
                <li><a href="#">وظائف</a></li>
                <li><a href="#">المدونة</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">خدمة العملاء</h4>
              <ul className="space-y-1.5 text-white/70">
                <li><a href="#">تواصل معنا</a></li>
                <li><a href="#">الأسئلة الشائعة</a></li>
                <li><a href="#">تتبع طلبك</a></li>
                <li><a href="#">سياسة الإرجاع</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">قانوني</h4>
              <ul className="space-y-1.5 text-white/70">
                <li><a href="#">الشروط والأحكام</a></li>
                <li><a href="#">سياسة الخصوصية</a></li>
                <li><a href="#">اتفاقية التقسيط</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">حمل التطبيق</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="inline-block">App Store</a>
                <a href="#" className="inline-block">Google Play</a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-y-3 text-xs text-white/60">
            <div>© ٢٠٢٥ Paynex. جميع الحقوق محفوظة.</div>
            
            <div className="flex items-center gap-4 text-lg">
              <span>طرق الدفع:</span>
              <span>Visa</span>
              <span>Mastercard</span>
              <span>ميزة</span>
              <span className="font-semibold text-[#C9A84C]">Paynex Wallet</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-[60] shadow-2xl">
        <div className="flex justify-around items-center h-14 text-xs">
          <Link href="/" className="flex flex-col items-center text-[#0A1628]">
            <div className="w-5 h-5 mb-0.5">🏠</div>
            <span className="text-[10px]">الرئيسية</span>
          </Link>
          <Link href="/products" className="flex flex-col items-center text-[#0A1628]">
            <div className="w-5 h-5 mb-0.5">📂</div>
            <span className="text-[10px]">الفئات</span>
          </Link>
          <Link href="/orders/new" className="flex flex-col items-center relative text-[#0A1628]">
            <div className="w-5 h-5 mb-0.5">🛒</div>
            <span className="text-[10px]">السلة</span>
            <span className="absolute -top-0.5 right-3 bg-[#F97316] text-[9px] text-white px-1 rounded-full">3</span>
          </Link>
          <Link href="/login" className="flex flex-col items-center text-[#0A1628]">
            <div className="w-5 h-5 mb-0.5">👤</div>
            <span className="text-[10px]">حسابي</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
