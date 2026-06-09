"use client";
import React, { useEffect, useState } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}

export default function AdUnit({ slot, format = "auto", className = "" }: AdUnitProps) {
  const [adEnabled, setAdEnabled] = useState(false);

  useEffect(() => {
    // Only enable ads in production or if needed
    setAdEnabled(true);
    
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsbygoogle error", e);
    }
  }, []);

  if (!adEnabled) return null;

  return (
    <div className={`ad-container my-8 overflow-hidden text-center ${className}`}>
      <span className="text-[10px] text-gray-400 block mb-1">إعلان</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
