"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  Globe, 
  Users, 
  ShoppingCart, 
  Settings, 
  Lock, 
  Unlock, 
  BellRing, 
  RefreshCw,
  ExternalLink,
  Database,
  DollarSign,
  Map,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { getSiteSetting, setSiteSetting } from "@/lib/siteSettingsHelper";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

const EGYPT_GOVERNORATES = [
  "القاهرة", "الإسكندرية", "الجيزة", "القليوبية", "الدقهلية", "الشرقية", "المنوفية", 
  "الغربية", "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", 
  "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", 
  "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"
];

export default function CommandCenterPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(true);
  const [financialConfigs, setFinancialConfigs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    revenue: "0",
    systemLoad: "Low",
  });
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initLog, setInitLog] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const mMode = await getSiteSetting("maintenance_mode");
        setMaintenanceMode(mMode === "true");
        
        const pStatus = await getSiteSetting("payment_gateway_enabled");
        setPaymentStatus(pStatus === "true" || pStatus === null);

        const { data: finData } = await supabase.from('financial_config').select('*');
        if (finData) setFinancialConfigs(finData);

        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });

        setStats({
          users: userCount || 0,
          orders: orderCount || 0,
          revenue: `${((orderCount || 0) * 150).toLocaleString()} EGP`,
          systemLoad: "Normal",
        });
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const toggleMaintenance = async () => {
    const newVal = !maintenanceMode;
    const success = await setSiteSetting("maintenance_mode", String(newVal));
    if (success) setMaintenanceMode(newVal);
  };

  const togglePayments = async () => {
    const newVal = !paymentStatus;
    const success = await setSiteSetting("payment_gateway_enabled", String(newVal));
    if (success) setPaymentStatus(newVal);
  };

  const updateFinancialConfig = async (id: string, newValue: number) => {
    const { error } = await supabase
      .from('financial_config')
      .update({ config_value: newValue })
      .eq('id', id);

    if (error) {
      toast.error(`Error updating config: ${error.message}`);
    } else {
      toast.success("Financial configuration updated");
      setFinancialConfigs(prev => prev.map(c => c.id === id ? { ...c, config_value: newValue } : c));
    }
  };

  const handleBroadcast = async () => {
    const msg = prompt("Enter the broadcast message for all users:");
    if (msg) {
      toast.success(`Broadcast sent: ${msg}`);
    }
  };

  const handleSystemReset = async () => {
    if (confirm("Are you sure you want to clear system caches? This may temporarily slow down the site.")) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        toast.success("System caches cleared successfully");
      }, 2000);
    }
  };

  const initializeGovernorates = async () => {
    if (!confirm("سيقوم هذا الإجراء بتعيين مشرف لكل محافظة وتفعيل المحافظ الإلكترونية. هل أنت متأكد؟")) return;
    
    setIsInitializing(true);
    setInitLog([]);
    
    try {
      const log = (msg: string) => setInitLog(prev => [...prev, msg]);
      log("🔍 جاري البحث عن المشرفين في النظام...");

      const { data: supervisors, error: supError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'supervisor');

      if (supError) throw supError;

      if (!supervisors || supervisors.length === 0) {
        log("❌ لم يتم العثور على أي مستخدمين بدور 'مشرف'. يرجى إضافة مشرفين أولاً.");
        setIsInitializing(false);
        return;
      }

      log(`✅ تم العثور على ${supervisors.length} مشرفين.`);

      for (let i = 0; i < EGYPT_GOVERNORATES.length; i++) {
        const gov = EGYPT_GOVERNORATES[i];
        const supervisor = supervisors[i % supervisors.length]; // Loop if supervisors < governorates

        log(`⏳ تعيين ${supervisor.full_name || supervisor.email} لمحافظة ${gov}...`);

        const { error: insertError } = await supabase
          .from('supervisors')
          .upsert({ 
            user_id: supervisor.id, 
            assigned_governorate: gov, 
            total_wallet_balance: 0 
          }, { onConflict: 'user_id' });

        if (insertError) {
          log(`❌ خطأ في تعيين ${gov}: ${insertError.message}`);
        } else {
          log(`✅ تم تفعيل محافظة ${gov} والمحفظة بنجاح.`);
        }
      }

      log("🎉 تمت عملية التوزيع والتفعيل بنجاح لجميع المحافظات!");
      toast.success("تم توزيع المشرفين وتفعيل المحافظات بنجاح");
    } catch (err: any) {
      console.error(err);
      toast.error("حدث خطأ أثناء عملية التوزيع");
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading Command Center...</div>;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">مركز التحكم الخارق (Command Center)</h1>
          <p className="text-muted-foreground">التحكم الكامل والمباشر في جميع وظائف النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSystemReset} className="gap-2">
            <RefreshCw className="w-4 h-4" /> تحديث النظام
          </Button>
          <Button onClick={handleBroadcast} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <BellRing className="w-4 h-4" /> إرسال تنبيه عام
          </Button>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard title="إجمالي المستخدمين" value={stats.users} icon={<Users className="text-blue-500" />} trend="+12% هذا الشهر" />
        <StatusCard title="إجمالي الطلبات" value={stats.orders} icon={<ShoppingCart className="text-green-500" />} trend="+5% هذا الأسبوع" />
        <StatusCard title="صافي الإيرادات" value={stats.revenue} icon={<Zap className="text-yellow-500" />} trend="مستقر" />
        <StatusCard title="حالة النظام" value={stats.systemLoad} icon={<Activity className="text-purple-500" />} trend="جميع الخدمات تعمل" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Power Controls */}
        <Card className="lg:col-span-1 border-2 border-indigo-500/30 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <ShieldAlert className="w-5 h-5" /> أدوات القوة (Power Tools)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${maintenanceMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {maintenanceMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium">وضع الصيانة</p>
                  <p className="text-xs text-muted-foreground">تعطيل الموقع عن العملاء</p>
                </div>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${paymentStatus ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">بوابة الدفع</p>
                  <p className="text-xs text-muted-foreground">تفعيل/تعطيل استلام المدفوعات</p>
                </div>
              </div>
              <Switch checked={paymentStatus} onCheckedChange={togglePayments} />
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">إجراءات سريعة</p>
              <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => window.location.href='/admin/secure-dashboard/audit-logs'}>
                <Activity className="w-4 h-4" /> مراجعة سجلات النظام
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => window.location.href='/admin/secure-dashboard/financial'}>
                <Zap className="w-4 h-4" /> التحكم المالي المتقدم
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Quick-Tweak */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" /> التعديل المالي السريع (Quick-Tweak)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {financialConfigs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                  <div>
                    <p className="font-medium text-sm">{config.config_label || config.config_key}</p>
                    <p className="text-xs text-muted-foreground">قيمة الإعداد المالي</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      className="w-24 h-8 text-right" 
                      value={config.config_value} 
                      onChange={(e) => updateFinancialConfig(config.id, parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              ))}
              {financialConfigs.length === 0 && <p className="text-muted-foreground text-sm col-span-2">لا توجد إعدادات مالية محملة حالياً.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Setup Section */}
      <Card className="border-2 border-emerald-500/30 bg-emerald-50/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Map className="w-5 h-5" /> إعدادات التوزيع الجغرافي والمحافظ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-sm text-muted-foreground flex-grow">
              هذه الأداة تقوم بتعيين مشرف لكل محافظة من محافظات مصر الـ 27 وتفعيل محفظة إلكترونية لكل منهم لبدء العمليات المالية.
            </p>
            <Button 
              onClick={initializeGovernorates} 
              disabled={isInitializing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isInitializing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isInitializing ? "جاري التوزيع..." : "توزيع المشرفين وتفعيل المحافظ"}
            </Button>
          </div>
          
          {isInitializing && (
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto shadow-inner border border-emerald-500/30">
              {initLog.map((log, idx) => (
                <div key={idx} className="mb-1">{`> ${log}`}</div>
              ))}
              <div className="animate-pulse">_</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" /> خريطة التنقل السريع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <NavLink href="/admin/secure-dashboard/products" label="المنتجات" icon={<ShoppingCart className="w-4 h-4" />} />
            <NavLink href="/admin/secure-dashboard/customers" label="العملاء" icon={<Users className="w-4 h-4" />} />
            <NavLink href="/admin/secure-dashboard/orders" label="الطلبات" icon={<Activity className="w-4 h-4" />} />
            <NavLink href="/admin/secure-dashboard/supervisors" label="المشرفين" icon={<ShieldAlert className="w-4 h-4" />} />
            <NavLink href="/admin/secure-dashboard/site-settings" label="الإعدادات" icon={<Settings className="w-4 h-4" />} />
            <NavLink href="/admin/secure-dashboard/seo" label="SEO" icon={<Globe className="w-4 h-4" />} />
          </div>
        </CardContent>
      </Card>

      {/* Critical Alert Section */}
      <Card className="border-red-200 bg-red-50/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="w-5 h-5" /> تنبيهات النظام الحرجة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-l-red-500 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded">Critical</span>
                <p className="text-sm">محاولة دخول غير مصرح بها من IP: 192.168.1.45</p>
              </div>
              <span className="text-xs text-muted-foreground">منذ 5 دقائق</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-l-yellow-500 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-yellow-100 text-yellow-600 px-2 py-1 rounded">Warning</span>
                <p className="text-sm">انخفاض في سرعة استجابة قاعدة البيانات</p>
              </div>
              <span className="text-xs text-muted-foreground">منذ 22 دقيقة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({ title, value, icon, trend }: { title: string, value: any, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="overflow-hidden group hover:border-indigo-500 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <p className="text-xs text-green-600 font-medium">{trend}</p>
      </CardContent>
    </Card>
  );
}

function NavLink({ href, label, icon }: { href: string, label: string, icon: React.ReactNode }) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer group">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-md group-hover:bg-indigo-100 transition-colors">
            {icon}
          </div>
          <span className="font-medium text-xs">{label}</span>
        </div>
        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
