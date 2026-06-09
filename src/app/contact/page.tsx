"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, send to Supabase or API
    console.log("Contact form submitted:", form);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", phone: "", message: "" });
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-2">تواصل معنا</h1>
      <p className="text-center text-gray-600 mb-8">فريق باينكس جاهز لمساعدتك</p>

      <div className="bg-white rounded-2xl shadow p-8">
        {submitted ? (
          <div className="text-center py-8 text-green-600 font-medium">
            تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم</label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                required 
                placeholder="اسمك الكامل" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
              <Input 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                required 
                placeholder="01xxxxxxxxx" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الرسالة</label>
              <textarea 
                className="w-full border rounded-md p-3 min-h-[120px]" 
                value={form.message} 
                onChange={(e) => setForm({ ...form, message: e.target.value })} 
                required 
                placeholder="كيف يمكننا مساعدتك؟"
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-[#0A1628]">
              إرسال الرسالة
            </Button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>الدعم الفني: 01000000000</p>
        <p>واتساب: 201000000000</p>
      </div>
    </div>
  );
}
