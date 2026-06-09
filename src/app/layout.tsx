import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import PWAInstallBanner from "@/components/shared/PWAInstallBanner";
import ConditionalLayout from "@/components/ConditionalLayout";

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
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <PWAInstallBanner />
      </body>
    </html>
  );
}
