"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setLogs(data);
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
      <h3 className="text-xl font-bold mb-6">سجل النشاطات</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الوقت</TableHead>
            <TableHead>المستخدم</TableHead>
            <TableHead>العملية</TableHead>
            <TableHead>الكيان</TableHead>
            <TableHead>IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs text-gray-500">
                {new Date(log.created_at).toLocaleString('ar-EG')}
              </TableCell>
              <TableCell>
                <div className="text-sm font-bold">{log.user_role}</div>
                <div className="text-xs text-gray-400">{log.user_id?.slice(0, 8)}</div>
              </TableCell>
              <TableCell className="text-sm font-medium">{log.action}</TableCell>
              <TableCell className="text-sm">{log.entity_type}</TableCell>
              <TableCell className="text-xs text-gray-400">{log.ip_address}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
