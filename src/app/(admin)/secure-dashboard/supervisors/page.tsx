"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Plus, MapPin, ShieldCheck, Lock, UserCheck, UserX, DollarSign } from "lucide-react";

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, locked: 0, loading: true });

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const { data } = await supabase
          .from('supervisors')
          .select(`*, user:users(*)`);
        
        if (data) {
          setSupervisors(data);
          setStats({
            total: data.length,
            active: data.filter(s => s.is_checked_in || s.isCheckedIn).length,
            locked: data.filter(s => s.user?.is_locked || s.user?.isLocked).length,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Error fetching supervisors:", err);
      }
    };
    fetchSupervisors();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#0A1628]">إدارة فريق المشرفين</h2>
          <p className="text-muted-foreground">التحكم في صلاحيات ومكافآت المشرفين الميدانيين</p>
        </div>
        <Button className="bg-[#0A1628] hover:bg-black text-white gap-2 px-6">
          <Plus size={20} /> إضافة مشرف جديد
        </Button>
      </div>

      {/* Supervisors KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المشرفين</CardTitle>
            <UserCheck className="text-blue-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">المشرفين المتصلين</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">حسابات مقفلة</CardTitle>
            <Lock className="text-red-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.locked}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold text-[#0A1628]">المشرف</TableHead>
              <TableHead className="font-bold text-[#0A1628]">المحافظة</TableHead>
              <TableHead className="font-bold text-[#0A1628]">الراتب الأساسي</TableHead>
              <TableHead className="font-bold text-[#0A1628]">الحالة المالية</TableHead>
              <TableHead className="font-bold text-[#0A1628] text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supervisors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">لا يوجد مشرفون مسجلون حالياً</TableCell>
              </TableRow>
            ) : (
              supervisors.map((s) => (
                <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {(s.user?.full_name || s.user?.fullName || 'S').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{s.user?.full_name || s.user?.fullName}</div>
                        <div className="text-xs text-gray-400">{s.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin size={14} className="text-gray-400" /> {s.assigned_governorate || s.assignedGovernorate}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-600" /> {s.base_salary || s.baseSalary} ج.م
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-[10px] w-fit font-bold ${s.is_checked_in || s.isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_checked_in || s.isCheckedIn ? 'مُسجل حضور' : 'غير متصل'}
                      </span>
                      {s.user?.is_locked || s.user?.isLocked ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] w-fit font-bold flex items-center gap-1">
                          <Lock size={10} /> مقفل مالياً
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] w-fit font-bold">حساب نشط</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 text-xs">
                      <MapPin size={14} /> الموقع
                    </Button>
                    <Button variant="ghost" size="icon" className="text-indigo-600 hover:bg-indigo-50" title="تعديل"><ShieldCheck size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
