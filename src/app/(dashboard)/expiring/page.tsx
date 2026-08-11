/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { getExpiringSubscriptions } from "@/app/actions/subscriptions";
import { renewSubscription } from "@/app/actions/subscription-actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessageCircle, RefreshCw } from "lucide-react";

export default function ExpiringPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [renewDialogSub, setRenewDialogSub] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const data = await getExpiringSubscriptions();
    setSubscriptions(data as any);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubscriptions = subscriptions.filter((sub) => {
    return sub.memberName.includes(searchQuery) || sub.phone.includes(searchQuery) || sub.membershipId.includes(searchQuery);
  });

  const handleRenew = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("subscriptionId", renewDialogSub.id);
    
    const res = await renewSubscription(formData);
    setIsSubmitting(false);
    
    if (res.success) {
      setRenewDialogSub(null);
      loadData();
    } else {
      alert(res.error);
    }
  };

  const openWhatsApp = (phone: string, memberName: string, endDate: Date, gymName: string) => {
    const text = `مرحباً ${memberName} 👋\n\nنود تذكيرك بأن اشتراكك في ${gymName} سينتهي بتاريخ ${new Date(endDate).toLocaleDateString("ar-SA")}.\n\nيسعدنا تجديد اشتراكك والاستمرار معنا.\n\nمع تحيات إدارة ${gymName}`;
    window.open(`https://wa.me/${phone.replace(/^0/, '966')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">قاربت على الانتهاء</h1>
        <p className="text-gray-500">الاشتراكات التي ستنتهي قريباً حسب إعدادات النادي.</p>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="ابحث بالاسم، الرقم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الهوية</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">تاريخ النهاية</TableHead>
                  <TableHead className="text-right">الأيام المتبقية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">لا توجد اشتراكات قاربت على الانتهاء.</TableCell></TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium text-gray-500">{sub.membershipId}</TableCell>
                      <TableCell className="font-bold">{sub.memberName}</TableCell>
                      <TableCell>{new Date(sub.endDate).toLocaleDateString("ar-SA")}</TableCell>
                      <TableCell>
                        <span className="text-yellow-600 font-bold">{sub.remainingDays} يوم</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setRenewDialogSub(sub)}>
                            <RefreshCw className="ml-1 h-3 w-3" /> تجديد
                          </Button>
                          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openWhatsApp(sub.phone, sub.memberName, sub.endDate, sub.gymName)}>
                            <MessageCircle className="ml-1 h-4 w-4" /> تذكير واتساب
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Renew Dialog */}
      <Dialog open={!!renewDialogSub} onOpenChange={(open) => !open && setRenewDialogSub(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تجديد اشتراك: {renewDialogSub?.memberName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenew} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">تاريخ البدء الجديد</Label>
              <Input id="startDate" name="startDate" type="date" required 
                     defaultValue={renewDialogSub?.remainingDays > 0 ? new Date(renewDialogSub?.endDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMonths">المدة بالشهور</Label>
              <Select name="durationMonths" required defaultValue="1">
                <SelectTrigger><SelectValue placeholder="اختر المدة" /></SelectTrigger>
                <SelectContent dir="rtl">
                  {[1, 3, 6, 12, 24].map((m) => <SelectItem key={m} value={m.toString()}>{m} أشهر</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">السعر (اختياري)</Label>
              <Input id="price" name="price" type="number" step="0.01" dir="ltr" className="text-right" />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ التجديد"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
