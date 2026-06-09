import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";

const cairo = Cairo({ subsets: ["latin", "arabic"] });

export const metadata: Metadata = {
  title: "Paynix - التقسيط الذكي للجيل القادم",
  description: "اشترِ الآن وادفع بالطريقة التي تناسبك مع باينكس",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Paynix",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1628",
};

import PWAInstallBanner from "@/components/shared/PWAInstallBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <PWAInstallBanner />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
