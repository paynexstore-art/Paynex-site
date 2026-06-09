import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";
import PWAInstallBanner from "@/components/shared/PWAInstallBanner";

const cairo = Cairo({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "Paynix - التقسيط الذكي للجيل القادم",
  description: "اشترِ الآن وادفع بالطريقة التي تناسبك مع باينكس",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <PWAInstallBanner />
        </div>
      </body>
    </html>
  );
}
