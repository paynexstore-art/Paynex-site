"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from('users').select('*').eq('role', 'customer');
      if (data) setCustomers(data);
    };
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">قائمة العملاء</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العميل</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>المحافظة</TableHead>
              <TableHead>تاريخ الانضمام</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-bold">{c.full_name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.governorate}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString('ar-EG')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
