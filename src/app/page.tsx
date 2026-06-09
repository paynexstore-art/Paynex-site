import HeroSection from "@/components/landing/HeroSection";
import StatsCounter from "@/components/landing/StatsCounter";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductsGrid from "@/components/landing/ProductsGrid";
import InstallmentCalculator from "@/components/landing/InstallmentCalculator";
import BrandsMarquee from "@/components/landing/BrandsMarquee";
import TestimonialsMarquee from "@/components/landing/TestimonialsMarquee";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsCounter />
      <HowItWorks />
      <ProductsGrid />
      <InstallmentCalculator />
      <BrandsMarquee />
      <TestimonialsMarquee />
      
      {/* Inquiry Fee Notice */}
      <section className="py-12 bg-[#0A1628] text-white">
        <div className="container mx-auto px-4 flex items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 bg-[#C9A84C]/20 rounded-full flex items-center justify-center text-[#C9A84C]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-xl">
            تطبق رسوم استعلام تدفع عند توقيع طلب التقسيط ورفع المستندات
          </p>
        </div>
      </section>
    </div>
  );
}
