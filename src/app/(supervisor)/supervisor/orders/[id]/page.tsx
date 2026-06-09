"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Camera, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { calculateDistance } from "@/lib/geofencing";
import { toast } from "sonner";

export default function SupervisorOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`*, product:products(*)`)
        .eq('id', id)
        .single();
      if (data) setOrder(data);
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  const verifyDistance = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast.error("GPS غير مدعوم");
        return resolve(false);
      }
      
      navigator.geolocation.getCurrentPosition((pos) => {
        const d = calculateDistance(
          pos.coords.latitude, pos.coords.longitude,
          30.0444, 31.2357 // Placeholder for Customer Location
        );
        setDistance(Math.round(d));
        if (d > 100) {
          toast.error(`أنت على بعد ${Math.round(d)} متر. يجب أن تكون أقل من 100 متر.`);
          return resolve(false);
        }
        resolve(true);
      });
    });
  };

  const handleConfirmFees = async () => {
    const confirmed = window.confirm("هل تأكدت من استلام مبلغ 100 جنيه رسوم استعلام؟");
    if (!confirmed) return;

    const res = await fetch(`/api/orders/${id}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({
        supervisorId: 'SUPERVISOR_ID', // Get from context
        amount: 100,
        type: 'inquiry_fee_collected'
      })
    });
    
    if (res.ok) {
      toast.success("تم تأكيد الاستلام وفتح صلاحية رفع المستندات");
      router.refresh();
    }
  };

  const handleUpload = async (type: string, file: File) => {
    const isClose = await verifyDistance();
    if (!isClose) return;

    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', id as string);
    formData.append('documentType', type);
    // Add other needed fields (lat, lng, supervisorName, userId)

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      toast.success("تم رفع المستند بنجاح");
    }
    setUploading(null);
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">طلب رقم: {order.order_number}</h2>
        <Badge className="bg-[#C9A84C] text-[#0A1628]">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#111d2f] border-gray-800 text-white">
          <CardHeader><CardTitle>بيانات العميل</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-gray-400 ml-2">الاسم:</span> {order.customer_name}</p>
            <p><span className="text-gray-400 ml-2">الهاتف:</span> {order.customer_phone}</p>
            <p><span className="text-gray-400 ml-2">المحافظة:</span> {order.customer_governorate}</p>
            <p><span className="text-gray-400 ml-2">العنوان:</span> {order.customer_address}</p>
            <p><span className="text-gray-400 ml-2">الوظيفة:</span> {order.customer_job}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111d2f] border-gray-800 text-white">
          <CardHeader><CardTitle>بيانات المنتج</CardTitle></CardHeader>
          <CardContent className="flex gap-4">
            <img src={order.product?.images?.[0]} className="w-20 h-20 object-contain rounded bg-white" />
            <div>
              <p className="font-bold">{order.product?.name_ar}</p>
              <p className="text-[#C9A84C]">{order.product?.display_price} ج.م</p>
              <p className="text-xs text-gray-400 mt-2">نظام التقسيط: {order.months} شهر</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.status === 'pending' && (
        <Card className="bg-yellow-500/10 border-yellow-500/50 text-yellow-200">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-yellow-500" />
              <p>يجب تحصيل رسوم الاستعلام (100 ج.م) لبدء العملية.</p>
            </div>
            <Button onClick={handleConfirmFees} className="bg-yellow-500 hover:bg-yellow-600 text-[#0A1628] font-bold">
              تأكيد استلام 100 ج.م
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status !== 'pending' && (
        <Card className="bg-[#111d2f] border-gray-800 text-white">
          <CardHeader>
            <CardTitle>رفع المستندات والتحقق الميداني</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-[#0A1628] rounded-lg flex items-center justify-between border border-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="text-[#00D4FF]" />
                <span>المسافة من العميل: {distance !== null ? `${distance} متر` : 'جاري التحديد...'}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => verifyDistance()}>تحديث الموقع</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "وجه البطاقة", type: "national_id_front" },
                { label: "ظهر البطاقة", type: "national_id_back" },
                { label: "إيصال مرافق", type: "utility_bill" },
                { label: "مفردات مرتب", type: "salary_slip" },
                { label: "صورة المنزل", type: "house_photo" },
              ].map((doc) => (
                <div key={doc.type} className="relative group">
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-xl hover:border-[#C9A84C] cursor-pointer bg-[#0A1628] transition-colors">
                    {uploading === doc.type ? (
                      <span className="animate-pulse text-xs">جاري الرفع...</span>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-500 group-hover:text-[#C9A84C]" />
                        <span className="text-[10px] mt-2 text-gray-400">{doc.label}</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => e.target.files?.[0] && handleUpload(doc.type, e.target.files[0])} 
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-800">
              <label className="text-sm font-bold">تقرير المشرف</label>
              <Textarea placeholder="اكتب ملاحظاتك عن العميل والزيارة الميدانية..." className="bg-[#0A1628] border-gray-700 h-32" />
              <Button className="w-full bg-[#10B981] hover:bg-[#0da070] text-white">إرسال التقرير للمدير</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
