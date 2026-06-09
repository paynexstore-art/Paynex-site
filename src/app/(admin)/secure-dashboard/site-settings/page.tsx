"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">إعدادات الموقع (CMS)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>الهوية البصرية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm block mb-2">اللون الرئيسي</label>
              <div className="flex gap-2">
                <Input type="color" className="w-12 h-10 p-1" defaultValue="#0A1628" />
                <Input defaultValue="#0A1628" />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-2">اللون الثانوي</label>
              <div className="flex gap-2">
                <Input type="color" className="w-12 h-10 p-1" defaultValue="#C9A84C" />
                <Input defaultValue="#C9A84C" />
              </div>
            </div>
            <Button className="bg-[#0A1628]">حفظ الألوان</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نصوص الصفحة الرئيسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm block mb-2">عنوان الهيرو</label>
              <Input defaultValue="التقسيط الذكي للجيل القادم" />
            </div>
            <div>
              <label className="text-sm block mb-2">وصف الهيرو</label>
              <Input defaultValue="اشترِ الآن وادفع بالطريقة التي تناسبك" />
            </div>
            <Button className="bg-[#0A1628]">حفظ النصوص</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
