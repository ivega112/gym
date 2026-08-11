/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "@/app/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Clock, CalendarDays, Snowflake, AlertTriangle, Activity, DatabaseBackupIcon, ClipboardList, CheckCircle2 } from "lucide-react";
import { BackupButton } from "@/components/BackupButton";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await getDashboardData();
      setData(res);
    }
    load();
  }, []);

  if (!data) return <div className="p-8 text-center text-gray-500">جاري تحميل لوحة القيادة...</div>;

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة القيادة</h1>
        <p className="text-gray-500">نظرة عامة على إحصائيات النادي والاشتراكات.</p>
      </div>

      {/* Backup Alert */}
      {!data.hasBackupToday && data.settings?.requireBackup && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold text-lg mb-2">تنبيه أمني هام!</AlertTitle>
          <AlertDescription className="text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>لم يتم أخذ النسخة الاحتياطية اليومية بعد. للحفاظ على أمان بيانات النادي، يرجى إنشاء النسخة الآن.</span>
            <BackupButton />
          </AlertDescription>
        </Alert>
      )}

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-green-800">الأعضاء النشطين</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-900">{data.totalActive}</div>
            <p className="text-xs text-green-700 mt-1">عضو بتمارين نشطة حالياً</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-yellow-800">قاربت على الانتهاء</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-yellow-900">{data.expiringSoon}</div>
            <p className="text-xs text-yellow-700 mt-1">تتطلب التجديد قريباً</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-blue-800">الاشتراكات المجمدة</CardTitle>
            <Snowflake className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-900">{data.frozen}</div>
            <p className="text-xs text-blue-700 mt-1">حسابات متوقفة مؤقتاً</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-purple-800">اشتراكات الشهر</CardTitle>
            <CalendarDays className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-900">{data.currentMonthSubs}</div>
            <p className="text-xs text-purple-700 mt-1">إجمالي الاشتراكات الجديدة للشهر</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Expiring Soon Preview */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
                تنبيهات الانتهاء القريبة
              </CardTitle>
              <Link href="/expiring" className="text-sm text-blue-600 hover:underline font-medium">
                عرض الكل
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.expiringSoonList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckCircle2 className="h-12 w-12 mb-3 text-green-300" />
                <p className="text-lg font-medium text-gray-500">لا توجد اشتراكات قاربت على الانتهاء</p>
                <p className="text-sm">جميع الاشتراكات سارية حالياً</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">رقم الهاتف</TableHead>
                      <TableHead className="text-right">متبقي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expiringSoonList.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-semibold">{sub.memberName}</TableCell>
                        <TableCell className="text-gray-500" dir="ltr">{sub.phone}</TableCell>
                        <TableCell>
                          <span className="font-bold text-yellow-600">{sub.remainingDays} يوم</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b bg-gray-50/50">
             <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-blue-600" />
                أحدث العمليات (سجل النظام)
              </CardTitle>
              <Link href="/logs" className="text-sm text-blue-600 hover:underline font-medium">
                سجل العمليات
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <ClipboardList className="h-12 w-12 mb-3 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">سجل العمليات فارغ</p>
                <p className="text-sm">لم يتم تسجيل أي عمليات حديثة في النظام</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.recentLogs.map((log: any) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-500 font-mono" dir="ltr">{log.time}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-2">{log.message}</p>
                    <p className="text-xs text-gray-500 mt-1">بواسطة: {log.user}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
