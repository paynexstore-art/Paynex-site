// src/components/SEO/SEOPanel.tsx
"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function SEOPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات SEO</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-bold block mb-2">Meta Title</label>
          <Input placeholder="Paynix - التقسيط الذكي في مصر" />
        </div>
        <div>
          <label className="text-sm font-bold block mb-2">Meta Description</label>
          <Textarea placeholder="وصف الموقع لمحركات البحث..." />
        </div>
        <div className="flex gap-4">
          <Button className="bg-[#0A1628]">حفظ التغييرات</Button>
          <Button variant="outline">توليد Sitemap</Button>
        </div>
      </CardContent>
    </Card>
  );
}
