"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function AdminFinancialConfigPage() {
  const [configs, setConfigs] = useState<any[]>([]);

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data } = await supabase.from('financial_config').select('*');
      if (data) setConfigs(data);
    };
    fetchConfigs();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">الإعدادات المالية</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">{config.config_label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="number" defaultValue={config.config_value} step="0.01" />
              <Button className="w-full bg-[#0A1628]">تحديث</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
