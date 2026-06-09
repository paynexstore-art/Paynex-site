import React from "react";
import GeoMap from "@/components/admin/GeoMap";

export default function AdminAnalyticsGeoPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">التوزيع الجغرافي للطلبات</h2>
      <GeoMap />
    </div>
  );
}
