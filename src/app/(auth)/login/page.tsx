"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loginWithEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await loginWithEmail(email, password);

    if ('error' in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ('user' in result && result.user) {
      const role = result.user.role || 'customer';
      
      // Also attempt Supabase session for middleware compatibility (optional, may fail if user not in Auth)
      try {
        await supabase.auth.signInWithPassword({ email, password });
      } catch (e) {
        console.log('Supabase session not created (user may not exist in Supabase Auth yet)');
      }

      // Role-based redirect
      if (role === 'admin' || role === 'super_admin') {
        router.push('/secure-dashboard');
      } else if (role === 'supervisor') {
        router.push('/supervisor');
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#0A1628]">تسجيل الدخول</CardTitle>
          <p className="text-sm text-gray-500">أهلاً بك مرة أخرى في باينكس</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@paynix.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-[#0A1628] hover:bg-[#1a2744]">
              {loading ? "جاري التحميل..." : "دخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center flex-col gap-2">
          <Link href="/register" className="text-sm text-[#C9A84C] hover:underline">ليس لديك حساب؟ سجل الآن</Link>
          <Link href="/forgot-password" className="text-sm text-gray-500 hover:underline">نسيت كلمة المرور؟</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
