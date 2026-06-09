"use client";
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function AdminPayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">الرواتب والجزاءات</h2>
        <Button className="bg-[#10B981]">اعتماد كشف الرواتب</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المشرف</TableHead>
                <TableHead>الأساسي</TableHead>
                <TableHead>الحوافز</TableHead>
                <TableHead>الجزاءات</TableHead>
                <TableHead>الصافي</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>أحمد علي</TableCell>
                <TableCell>5,000 ج.م</TableCell>
                <TableCell className="text-green-600">+1,200 ج.م</TableCell>
                <TableCell className="text-red-600">-100 ج.م</TableCell>
                <TableCell className="font-bold text-lg">6,100 ج.م</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">إضافة جزاء</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
