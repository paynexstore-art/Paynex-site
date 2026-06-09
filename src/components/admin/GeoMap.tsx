"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function GeoMap() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-[400px] bg-gray-100 animate-pulse rounded-xl"></div>;

  return (
    <div className="h-[400px] rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* @ts-ignore */}
      <MapContainer center={[30.0444, 31.2357]} zoom={6} style={{ height: "100%", width: "100%" }}>
        {/* @ts-ignore */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {/* Mock Markers for Supervisors */}
        {/* @ts-ignore */}
        <Marker position={[30.0444, 31.2357]}>
          {/* @ts-ignore */}
          <Popup>القاهرة: 500 طلب نشط</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
