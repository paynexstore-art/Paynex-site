"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Image as ImageIcon, MessageSquare } from "lucide-react";

export default function AIMarketingStudio() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerateText = async () => {
    setGenerating(true);
    // Simulate AI call
    setTimeout(() => {
      setResult("احصل على أحدث هاتف سامسونج الآن بأقل قسط شهري في مصر! مع باينكس، التقسيط أصبح أسهل وأسرع. بدون مقدم وبدون تعقيدات.");
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">استوديو التسويق بالذكاء الاصطناعي</h2>
        <div className="flex gap-2">
          <Button variant="outline"><Sparkles className="ml-2 w-4 h-4" /> Gemini AI</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="text-[#C9A84C]" /> إنشاء محتوى إعلاني
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="اكتب عن ماذا تريد الإعلان... (مثال: عرض تقسيط بمناسبة العيد)" 
              className="h-32"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button onClick={handleGenerateText} disabled={generating} className="w-full bg-[#0A1628]">
              {generating ? "جاري الإنشاء..." : "إنشاء نص إحترافي"}
            </Button>
            
            {result && (
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-4">
                <p className="text-sm leading-relaxed">{result}</p>
                <Button variant="link" className="p-0 h-auto mt-2 text-[#C9A84C]">نسخ النص</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="text-[#C9A84C]" /> تصميم بوستر إعلاني
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <p className="text-gray-400 text-sm">اختر المنتج لتوليد بوستر له</p>
            </div>
            <Button className="w-full bg-[#0A1628]">توليد بوستر بالذكاء الاصطناعي</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
