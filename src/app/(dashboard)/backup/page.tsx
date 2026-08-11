/* eslint-disable */
import { getGymSettings } from "@/app/actions/settings";
import { BackupButton } from "@/components/BackupButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseBackup, FileSpreadsheet, Lock } from "lucide-react";

export default async function BackupPage() {
  const settings = await getGymSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">النسخ الاحتياطي (Backups)</h1>
        <p className="text-gray-500">قم بإنشاء وتنزيل نسخة احتياطية كاملة لبيانات النادي بصيغة Excel.</p>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="bg-blue-50/50 pb-4 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <DatabaseBackup className="h-6 w-6 text-blue-600" />
            إنشاء نسخة احتياطية جديدة
          </CardTitle>
          <CardDescription>
            سيتم استخراج كافة البيانات الحالية (الأعضاء، الاشتراكات، السجلات، الخ) وتنزيلها كملف Excel (xlsx).
            كما سيتم فتح واتساب تلقائياً لإرسال الملف للمشرف للحفظ الآمن.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg text-center gap-2 border">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <span className="font-semibold">7 أوراق عمل</span>
              <span className="text-gray-500 text-xs">شاملة لكل تفاصيل النظام</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg text-center gap-2 border">
              <Lock className="h-8 w-8 text-gray-700" />
              <span className="font-semibold">بيانات آمنة</span>
              <span className="text-gray-500 text-xs">بدون تصدير كلمات المرور</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg text-center gap-2 border">
              <DatabaseBackup className="h-8 w-8 text-blue-600" />
              <span className="font-semibold">تسجيل العملية</span>
              <span className="text-gray-500 text-xs">يتم توثيق النسخ في السجل</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <strong>ملاحظة هامة:</strong> تأكد من إرفاق الملف الذي سيتم تنزيله في محادثة الواتساب التي ستفتح تلقائياً للحفاظ على نسخة احتياطية آمنة خارج الجهاز.
          </div>

          <div className="flex justify-center pt-2">
            <BackupButton className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all" />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
