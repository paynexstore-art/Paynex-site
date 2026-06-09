"use client";

import { usePathname } from 'next/navigation';
import Navbar from "@/components/shared/Navbar";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      {!isHome && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
