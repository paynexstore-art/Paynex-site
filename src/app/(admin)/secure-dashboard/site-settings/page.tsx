"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllSiteSettings, setSiteSetting } from "@/lib/siteSettingsHelper";
import { toast } from "sonner";

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getAllSiteSettings();
      const settingsMap: Record<string, string> = {};
      data.forEach((s: any) => {
        settingsMap[s.setting_key] = s.setting_value || "";
      });
      setSettings(settingsMap);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (key: string, value: string) => {
    const success = await setSiteSetting(key, value);
    if (success) {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  if (loading) return <div className="p-8">جاري تحميل الإعدادات...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إعدادات الموقع (CMS)</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>الهوية البصرية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm block mb-2">اللون الرئيسي</label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  className="w-12 h-10 p-1" 
                  value={settings["primary_color"] || "#0A1628"} 
                  onChange={(e) => handleSave("primary_color", e.target.value)}
                />
                <Input 
                  value={settings["primary_color"] || "#0A1628"} 
                  onChange={(e) => handleSave("primary_color", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-2">اللون الثانوي</label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  className="w-12 h-10 p-1" 
                  value={settings["secondary_color"] || "#C9A84C"} 
                  onChange={(e) => handleSave("secondary_color", e.target.value)}
                />
                <Input 
                  value={settings["secondary_color"] || "#C9A84C"} 
                  onChange={(e) => handleSave("secondary_color", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نصوص الصفحة الرئيسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm block mb-2">عنوان الهيرو</label>
              <Input 
                value={settings["hero_title"] || "التقسيط الذكي للجيل القادم"} 
                onChange={(e) => handleSave("hero_title", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm block mb-2">وصف الهيرو</label>
              <Input 
                value={settings["hero_description"] || "اشترِ الآن وادفع بالطريقة التي تناسبك"} 
                onChange={(e) => handleSave("hero_description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
