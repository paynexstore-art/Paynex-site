"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function AIMarketingStudio() {
  const [prompt, setPrompt] = useState("اكتب إعلانًا قصيرًا عن التقسيط الذكي بدون مقدم");
  const generatedCopy = `امتلك احتياجاتك الآن مع باينكس، وقسّط براحة وشفافية بدون تعقيدات. اختر المنتج، قدم الطلب، واستمتع بخطة دفع مناسبة لك.`;

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#C9A84C]" />
          استوديو التسويق الذكي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-28"
          placeholder="اكتب فكرة الحملة التسويقية..."
        />
        <Button type="button" className="bg-[#0A1628] hover:bg-[#152238]">
          توليد نص تسويقي
        </Button>
        <div className="rounded-lg border bg-gray-50 p-4 text-sm leading-7 text-gray-700">
          {generatedCopy}
        </div>
      </CardContent>
    </Card>
  );
}
