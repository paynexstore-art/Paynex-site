"use client";
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminAttendancePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">مراقبة الحضور والانصراف (المشرفين)</h2>
      <Table className="bg-white rounded-xl">
        <TableHeader>
          <TableRow>
            <TableHead>المشرف</TableHead>
            <TableHead>اليوم</TableHead>
            <TableHead>وقت الحضور</TableHead>
            <TableHead>الموقع</TableHead>
            <TableHead>الحالة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>أحمد علي</TableCell>
            <TableCell>اليوم</TableCell>
            <TableCell>09:15 AM</TableCell>
            <TableCell>القاهرة (داخل النطاق)</TableCell>
            <TableCell><span className="text-green-600">حاضر</span></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
