"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addMemberWithSubscription } from "@/app/actions/members";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddMemberPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addMemberWithSubscription(formData);
    setIsLoading(false);
    
    if (res.success) {
      alert("تمت إضافة الاشتراك بنجاح.");
      router.push("/subscriptions");
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إضافة اشتراك جديد</h1>
        <p className="text-gray-500">سجل بيانات العضو الجديد وتفاصيل اشتراكه.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>بيانات العضو</CardTitle>
            <CardDescription>المعلومات الشخصية للعضو المشترك.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل <span className="text-red-500">*</span></Label>
              <Input id="fullName" name="fullName" required placeholder="أدخل اسم العضو" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف <span className="text-red-500">*</span></Label>
              <Input id="phone" name="phone" required placeholder="05xxxxxxxx" dir="ltr" className="text-right" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryPhone">رقم هاتف إضافي (اختياري)</Label>
              <Input id="secondaryPhone" name="secondaryPhone" placeholder="05xxxxxxxx" dir="ltr" className="text-right" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">الجنس</Label>
              <Select name="gender" defaultValue="ذكر">
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="ذكر">ذكر</SelectItem>
                  <SelectItem value="أنثى">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">تاريخ الميلاد (اختياري)</Label>
              <Input id="dob" name="dob" type="date" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Input id="notes" name="notes" placeholder="أي ملاحظات طبية أو خاصة..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الاشتراك</CardTitle>
            <CardDescription>مدة الاشتراك وتاريخ البدء.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">تاريخ البداية <span className="text-red-500">*</span></Label>
              <Input id="startDate" name="startDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMonths">مدة الاشتراك <span className="text-red-500">*</span></Label>
              <Select name="durationMonths" required defaultValue="1">
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {month} {month === 1 ? 'شهر' : month <= 10 ? 'أشهر' : 'شهراً'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">السعر (اختياري)</Label>
              <Input id="price" name="price" type="number" step="0.01" placeholder="قيمة الاشتراك" dir="ltr" className="text-right" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "جاري الحفظ..." : "حفظ الاشتراك"}
          </Button>
        </div>
      </form>
    </div>
  );
}
