"use client";
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SupervisorAttendancePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">سجل الحضور والانصراف</h2>
      <div className="bg-[#111d2f] rounded-xl overflow-hidden border border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800">
              <TableHead className="text-gray-400">التاريخ</TableHead>
              <TableHead className="text-gray-400">الحضور</TableHead>
              <TableHead className="text-gray-400">الانصراف</TableHead>
              <TableHead className="text-gray-400">ساعات العمل</TableHead>
              <TableHead className="text-gray-400">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-gray-800">
              <TableCell>2024-06-01</TableCell>
              <TableCell>09:05 AM</TableCell>
              <TableCell>05:10 PM</TableCell>
              <TableCell>8.5 ساعة</TableCell>
              <TableCell><span className="text-green-400">حاضر</span></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
