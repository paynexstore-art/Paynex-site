"use client";
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SupervisorWalletPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">المحفظة والعهد</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-[#111d2f] border-gray-800 text-white">
          <CardHeader><CardTitle>الرصيد الحالي</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold text-[#C9A84C]">0 ج.م</div></CardContent>
        </Card>
        <Card className="bg-[#111d2f] border-gray-800 text-white">
          <CardHeader><CardTitle>إجمالي المديونية</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold text-red-400">1,250 ج.م</div></CardContent>
        </Card>
      </div>

      <div className="bg-[#111d2f] rounded-xl overflow-hidden border border-gray-800 p-6">
        <h3 className="text-xl font-bold mb-6">سجل المعاملات</h3>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800">
              <TableHead className="text-gray-400">التاريخ</TableHead>
              <TableHead className="text-gray-400">العملية</TableHead>
              <TableHead className="text-gray-400">المبلغ</TableHead>
              <TableHead className="text-gray-400">الرصيد بعد</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-gray-800">
              <TableCell>2024-06-05</TableCell>
              <TableCell>تحصيل رسوم استعلام</TableCell>
              <TableCell className="text-red-400">+100 ج.م</TableCell>
              <TableCell>1,250 ج.م</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
