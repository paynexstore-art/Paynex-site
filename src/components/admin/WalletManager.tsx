"use client";
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function WalletManager() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-xl font-bold mb-6">إدارة المحافظ والعهد</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المشرف</TableHead>
            <TableHead>المحافظة</TableHead>
            <TableHead>الرصيد الحالي</TableHead>
            <TableHead>المديونية</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>أحمد علي</TableCell>
            <TableCell>القاهرة</TableCell>
            <TableCell>1,500 ج.م</TableCell>
            <TableCell className="text-red-500 font-bold">450 ج.م</TableCell>
            <TableCell><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">نشط</span></TableCell>
            <TableCell>
              <Button size="sm" className="bg-[#C9A84C] text-[#0A1628]">تصفية العهدة</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
