"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, FileText, Map as MapIcon, ShieldCheck } from "lucide-react";
import { calculateCreditScore } from "@/lib/creditScore";
import { toast } from "sonner";

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [creditScore, setCreditScore] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`*, product:products(*), supervisor:supervisors(*, user:users(*))`)
        .eq('id', id)
        .single();
      
      const { data: docData } = await supabase
        .from('documents')
        .select('*')
        .eq('order_id', id);

      if (orderData) {
        setOrder(orderData);
        const score = calculateCreditScore({
          requestedAmount: Number(orderData.product?.display_price || 0),
          jobType: orderData.customer_job === 'حكومي' ? 'government' : 'private'
        });
        setCreditScore(score);
      }
      if (docData) setDocuments(docData);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleAction = async (status: string) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        adminNotes,
        decisionBy: 'ADMIN_ID' // From context
      })
    });

    if (res.ok) {
      toast.success(status === 'approved' ? "تمت الموافقة على الطلب" : "تم رفض الطلب");
      router.push('/secure-dashboard/orders');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مراجعة طلب: {order.order_number}</h2>
          <p className="text-gray-500">تاريخ التقديم: {new Date(order.created_at).toLocaleString('ar-EG')}</p>
        </div>
        <Badge className="text-lg py-2 px-4">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader><CardTitle>بيانات العميل والطلب</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">اسم العميل</p>
                <p className="font-bold">{order.customer_name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">الرقم القومي</p>
                <p className="font-bold">{order.customer_national_id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">المنتج</p>
                <p className="font-bold">{order.product?.name_ar}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">نظام التقسيط</p>
                <p className="font-bold text-[#C9A84C]">{order.months} شهر</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex justify-between">المستندات المرفوعة <Badge variant="outline">{documents.length}</Badge></CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="space-y-2">
                    <img src={doc.processed_url} className="w-full h-40 object-cover rounded-lg border hover:scale-105 transition-transform cursor-pointer" />
                    <p className="text-[10px] text-center font-bold text-gray-500 uppercase">{doc.document_type}</p>
                    <div className="flex items-center justify-center gap-1 text-[8px] text-green-600">
                      <ShieldCheck size={10} /> Watermark Applied
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className={`border-t-4 ${creditScore?.riskLevel === 'low' ? 'border-green-500' : 'border-yellow-500'}`}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><FileText size={18} /> Credit Score الذكي</CardTitle></CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-5xl font-black text-[#0A1628]">{creditScore?.score}</div>
              <Badge className={creditScore?.riskLevel === 'low' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                {creditScore?.recommendation}
              </Badge>
              <div className="text-right space-y-1 mt-4">
                {creditScore?.factors.map((f: string, i: number) => (
                  <p key={i} className="text-[10px] text-gray-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span> {f}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>القرار النهائي</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="text-sm">ملاحظات المدير</label>
              <Textarea 
                placeholder="اكتب سبب الموافقة أو الرفض..." 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)} 
              />
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleAction('approved')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-6">
                  <CheckCircle className="ml-2" /> موافقة
                </Button>
                <Button onClick={() => handleAction('rejected')} variant="destructive" className="font-bold py-6">
                  <XCircle className="ml-2" /> رفض
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">بيانات المشرف</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div>
                <p className="text-sm font-bold">{order.supervisor?.user?.full_name}</p>
                <p className="text-[10px] text-gray-400">محافظة {order.supervisor?.assigned_governorate}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
