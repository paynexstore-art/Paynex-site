"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Plus, MapPin, ShieldCheck, Lock } from "lucide-react";

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<any[]>([]);

  useEffect(() => {
    const fetchSupervisors = async () => {
      const { data } = await supabase
        .from('supervisors')
        .select(`*, user:users(*)`);
      if (data) setSupervisors(data);
    };
    fetchSupervisors();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المشرفين</h2>
        <Button className="bg-[#0A1628]"><Plus className="ml-2" /> إضافة مشرف جديد</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المشرف</TableHead>
              <TableHead>المحافظة</TableHead>
              <TableHead>الراتب الأساسي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supervisors.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-bold">{s.user?.full_name}</div>
                  <div className="text-xs text-gray-400">{s.user?.email}</div>
                </TableCell>
                <TableCell>{s.assigned_governorate}</TableCell>
                <TableCell>{s.base_salary} ج.م</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 rounded text-[10px] w-fit font-bold ${s.is_checked_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_checked_in ? 'مُسجل حضور' : 'غير متصل'}
                    </span>
                    {s.user?.is_locked && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] w-fit font-bold flex items-center gap-1"><Lock size={10} /> مقفل مالياً</span>}
                  </div>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="ghost" size="icon" title="الموقع الميداني"><MapPin size={16} /></Button>
                  <Button variant="ghost" size="icon" title="تعديل"><ShieldCheck size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
