/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/app/actions/logs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
      setIsLoading(false);
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.message.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.memberName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سجل العمليات (Audit Logs)</h1>
        <p className="text-gray-500">سجل مفصل لجميع العمليات والحركات التي تمت في النظام.</p>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="ابحث في السجلات (الرسالة، نوع الإجراء، المشرف، العضو)..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-9" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ والوقت</TableHead>
                  <TableHead className="text-right">نوع الإجراء</TableHead>
                  <TableHead className="text-right w-1/3">الرسالة</TableHead>
                  <TableHead className="text-right">العضو</TableHead>
                  <TableHead className="text-right">المشرف</TableHead>
                  <TableHead className="text-right">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">لا توجد سجلات مطابقة.</TableCell></TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.actionType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell>{log.memberName}</TableCell>
                      <TableCell className="font-semibold">{log.performedBy}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="ml-2 h-4 w-4" /> عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>تفاصيل السجل: {selectedLog?.actionType}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[60vh] mt-4 pr-4 border rounded-md p-4 bg-gray-50">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-500 mb-1">الرسالة</h4>
                <p className="text-sm font-medium">{selectedLog?.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">المشرف</h4>
                  <p className="text-sm">{selectedLog?.performedBy}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">تاريخ العملية</h4>
                  <p className="text-sm">{selectedLog && new Date(selectedLog.timestamp).toLocaleString("ar-SA")}</p>
                </div>
              </div>

              {selectedLog?.oldData && (
                <div>
                  <h4 className="font-semibold text-sm text-red-600 mb-1">البيانات السابقة (Old Data)</h4>
                  <pre className="text-xs bg-white p-3 rounded-md border overflow-x-auto" dir="ltr">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog?.newData && (
                <div>
                  <h4 className="font-semibold text-sm text-green-600 mb-1">البيانات الجديدة (New Data)</h4>
                  <pre className="text-xs bg-white p-3 rounded-md border overflow-x-auto" dir="ltr">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
