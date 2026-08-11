/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { getActiveSubscriptions } from "@/app/actions/subscriptions";
import { renewSubscription, freezeSubscription, unfreezeSubscription } from "@/app/actions/subscription-actions";
import { useSubscriptionStore } from "@/store/subscriptions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, MessageCircle, Play, Pause, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function SubscriptionsPage() {
  const { subscriptions, setSubscriptions, searchQuery, setSearchQuery, statusFilter, setStatusFilter } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog States
  const [renewDialogSub, setRenewDialogSub] = useState<any>(null);
  const [freezeDialogSub, setFreezeDialogSub] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freezeReason, setFreezeReason] = useState("Injury");

  const loadData = async () => {
    setIsLoading(true);
    const data = await getActiveSubscriptions();
    setSubscriptions(data as any);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [setSubscriptions]);

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.memberName.includes(searchQuery) || sub.phone.includes(searchQuery) || sub.membershipId.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  const handleFreeze = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("subscriptionId", freezeDialogSub.id);
    formData.append("reason", freezeReason);
    
    const res = await freezeSubscription(formData);
    setIsSubmitting(false);
    
    if (res.success) {
      setFreezeDialogSub(null);
      loadData();
    } else {
      alert(res.error);
    }
  };

  const handleUnfreeze = async (subId: string) => {
    if (confirm("هل أنت متأكد من إلغاء التجميد؟ سيتم حساب أيام التجميد وتمديد الاشتراك بها.")) {
      setIsSubmitting(true);
      const res = await unfreezeSubscription(subId);
      setIsSubmitting(false);
      if (res.success) {
        loadData();
      } else {
        alert(res.error);
      }
    }
  };

  const openWhatsApp = (phone: string, memberName: string, endDate: Date, gymName: string) => {
    const text = `مرحباً ${memberName} 👋\n\nنود تذكيرك بأن اشتراكك في ${gymName} سينتهي بتاريخ ${new Date(endDate).toLocaleDateString("ar-SA")}.\n\nيسعدنا تجديد اشتراكك والاستمرار معنا.\n\nمع تحيات إدارة ${gymName}`;
    window.open(`https://wa.me/${phone.replace(/^0/, '966')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">نشط</span>;
      case "EXPIRING_SOON": return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">قارب على الانتهاء</span>;
      case "EXPIRED": return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">منتهي</span>;
      case "FROZEN": return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">مجمد</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الاشتراكات</h1>
          <p className="text-gray-500">عرض وإدارة جميع اشتراكات الأعضاء.</p>
        </div>
        <Link href="/add">
          <Button>إضافة اشتراك جديد</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="ابحث بالاسم، الرقم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9" />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
                <SelectTrigger><SelectValue placeholder="حالة الاشتراك" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع الحالات</SelectItem>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                  <SelectItem value="EXPIRING_SOON">قارب على الانتهاء</SelectItem>
                  <SelectItem value="EXPIRED">منتهي</SelectItem>
                  <SelectItem value="FROZEN">مجمد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الهوية</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">تاريخ النهاية</TableHead>
                  <TableHead className="text-right">الأيام المتبقية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">لا توجد اشتراكات مطابقة.</TableCell></TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium text-gray-500">{sub.membershipId}</TableCell>
                      <TableCell className="font-bold">{sub.memberName}</TableCell>
                      <TableCell>{new Date(sub.startDate).toLocaleDateString("ar-SA")}</TableCell>
                      <TableCell>{new Date(sub.endDate).toLocaleDateString("ar-SA")}</TableCell>
                      <TableCell>
                        {sub.status === "FROZEN" ? "-" : (
                          <span className={sub.remainingDays < 0 ? "text-red-600 font-bold" : ""}>
                            {sub.remainingDays < 0 ? "منتهي" : `${sub.remainingDays} يوم`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => setRenewDialogSub(sub)}>
                            <RefreshCw className="ml-1 h-3 w-3" /> تجديد
                          </Button>
                          {sub.status === "ACTIVE" || sub.status === "EXPIRING_SOON" ? (
                            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setFreezeDialogSub(sub)}>
                              <Pause className="ml-1 h-3 w-3" /> تجميد
                            </Button>
                          ) : sub.status === "FROZEN" ? (
                            <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" disabled={isSubmitting} onClick={() => handleUnfreeze(sub.id)}>
                              <Play className="ml-1 h-3 w-3" /> تفعيل
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openWhatsApp(sub.phone, sub.memberName, sub.endDate, sub.gymName)}>
                            <MessageCircle className="h-4 w-4" />
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

      {/* Freeze Dialog */}
      <Dialog open={!!freezeDialogSub} onOpenChange={(open) => !open && setFreezeDialogSub(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تجميد اشتراك: {freezeDialogSub?.memberName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFreeze} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>سبب التجميد</Label>
              <Select value={freezeReason} onValueChange={(val) => setFreezeReason(val || "Injury")} required>
                <SelectTrigger><SelectValue placeholder="اختر السبب" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="Injury">إصابة رياضية</SelectItem>
                  <SelectItem value="Travel">سفر</SelectItem>
                  <SelectItem value="Other">سبب آخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {freezeReason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="customReason">توضيح السبب</Label>
                <Input id="customReason" name="customReason" required />
              </div>
            )}
            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
              {isSubmitting ? "جاري التجميد..." : "تأكيد التجميد"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
