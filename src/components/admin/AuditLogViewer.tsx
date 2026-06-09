"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const logs = [
  { actor: "admin@paynix.com", action: "تسجيل دخول", time: "منذ 5 دقائق", status: "ناجح" },
  { actor: "system", action: "مزامنة الطلبات", time: "منذ 18 دقيقة", status: "مكتمل" },
  { actor: "supervisor", action: "تحديث حالة طلب", time: "منذ ساعة", status: "ناجح" },
];

export default function AuditLogViewer() {
  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          آخر العمليات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-right text-gray-500">
                <th className="py-3 font-medium">المستخدم</th>
                <th className="py-3 font-medium">الإجراء</th>
                <th className="py-3 font-medium">الوقت</th>
                <th className="py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={`${log.actor}-${index}`} className="border-b last:border-0">
                  <td className="py-3 text-gray-800">{log.actor}</td>
                  <td className="py-3 text-gray-700">{log.action}</td>
                  <td className="py-3 text-gray-500">{log.time}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
