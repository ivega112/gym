/* eslint-disable */
import { getGymSettings, updateGymSettings } from "@/app/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RestoreButton } from "@/components/RestoreButton";

export default async function SettingsPage() {
  const settings = await getGymSettings();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إعدادات النادي</h1>
        <p className="text-gray-500">قم بإدارة إعدادات النظام الأساسية وتكوينات النسخ الاحتياطي.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الإعدادات العامة</CardTitle>
          <CardDescription>هذه المعلومات ستظهر في رسائل الواتساب والتنبيهات.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateGymSettings as any} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gymName">اسم النادي</Label>
              <Input id="gymName" name="gymName" defaultValue={settings?.gymName || ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gymPhone">رقم هاتف النادي</Label>
              <Input id="gymPhone" name="gymPhone" defaultValue={settings?.gymPhone || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">رقم الواتساب للمشرف (للنسخ الاحتياطي)</Label>
              <Input id="whatsappNumber" name="whatsappNumber" defaultValue={settings?.whatsappNumber || ""} placeholder="966500000000" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationThreshold">تنبيه اقتراب الانتهاء (بالأيام)</Label>
                <Input id="expirationThreshold" name="expirationThreshold" type="number" defaultValue={settings?.expirationThreshold?.toString() || "7"} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="archiveThreshold">الأرشفة التلقائية بعد الانتهاء (بالأيام)</Label>
                <Input id="archiveThreshold" name="archiveThreshold" type="number" defaultValue={settings?.archiveThreshold?.toString() || "17"} required />
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto">حفظ الإعدادات</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-700 tracking-wider font-bold">SYSTEM RESTORE</CardTitle>
          <CardDescription>
            استعادة بيانات النظام بالكامل باستخدام ملف النسخة الاحتياطية (JSON). هذه العملية ستقوم بمسح جميع البيانات الحالية بشكل لا رجعة فيه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestoreButton />
        </CardContent>
      </Card>
    </div>
  );
}
