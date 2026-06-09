import React from "react";
import AuditLogViewer from "@/components/admin/AuditLogViewer";

export default function AdminAuditLogPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">سجل العمليات الآمن</h2>
      <p className="text-gray-500">سجل غير قابل للتعديل لجميع العمليات التي تمت على النظام.</p>
      <AuditLogViewer />
    </div>
  );
}
