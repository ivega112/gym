"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addMonths, differenceInDays } from "date-fns";
import { getCurrentUserId } from "./auth";

export async function renewSubscription(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    const subscriptionId = formData.get("subscriptionId") as string;
    const startDateString = formData.get("startDate") as string;
    const durationMonths = parseInt(formData.get("durationMonths") as string);
    const priceString = formData.get("price") as string;
    const price = priceString ? parseFloat(priceString) : null;

    if (!subscriptionId || !startDateString || !durationMonths) {
      return { success: false, error: "معلومات التجديد غير مكتملة" };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { member: true },
    });

    if (!subscription) {
      return { success: false, error: "الاشتراك غير موجود" };
    }

    const newStartDate = new Date(startDateString);
    const newEndDate = addMonths(newStartDate, durationMonths);

    await prisma.$transaction(async (tx) => {
      // 1. Create Renewal Record
      await tx.subscriptionRenewal.create({
        data: {
          subscriptionId,
          startDate: newStartDate,
          endDate: newEndDate,
          durationMonths,
          price,
        },
      });

      // 2. Update Main Subscription
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
          durationMonths,
          price,
          status: "ACTIVE",
        },
      });

      // 3. Update Member Status if needed
      await tx.member.update({
        where: { id: subscription.memberId },
        data: { status: "ACTIVE" },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actionType: "SUBSCRIPTION_RENEWED",
          message: `تم تجديد اشتراك العضو ${subscription.member.fullName} لمدة ${durationMonths} أشهر.`,
          memberId: subscription.memberId,
          oldData: { endDate: subscription.endDate, status: subscription.status },
          newData: { endDate: newEndDate, durationMonths, price, status: "ACTIVE" },
          performedById: userId,
        },
      });
    });

    revalidatePath("/subscriptions");
    revalidatePath("/expiring");
    revalidatePath("/expired");
    return { success: true };
  } catch (error) {
    console.error("Failed to renew subscription", error);
    return { success: false, error: "فشل في تجديد الاشتراك" };
  }
}

export async function freezeSubscription(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    const subscriptionId = formData.get("subscriptionId") as string;
    const reason = formData.get("reason") as string;
    const customReason = formData.get("customReason") as string;

    if (!subscriptionId || !reason) {
      return { success: false, error: "بيانات التجميد غير مكتملة" };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { member: true },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return { success: false, error: "يمكن تجميد الاشتراكات النشطة فقط" };
    }

    const startDate = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.subscriptionFreeze.create({
        data: {
          subscriptionId,
          startDate,
          reason,
          customReason: customReason || null,
        },
      });

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: "FROZEN" },
      });

      await tx.member.update({
        where: { id: subscription.memberId },
        data: { status: "FROZEN" },
      });

      await tx.auditLog.create({
        data: {
          actionType: "SUBSCRIPTION_FROZEN",
          message: `تم تجميد اشتراك العضو ${subscription.member.fullName} بسبب: ${reason === "Other" ? customReason : reason}.`,
          memberId: subscription.memberId,
          oldData: { status: subscription.status },
          newData: { status: "FROZEN", freezeStartDate: startDate, reason },
          performedById: userId,
        },
      });
    });

    revalidatePath("/subscriptions");
    return { success: true };
  } catch (error) {
    console.error("Failed to freeze", error);
    return { success: false, error: "فشل في تجميد الاشتراك" };
  }
}

export async function unfreezeSubscription(subscriptionId: string) {
  try {
    const userId = await getCurrentUserId();
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { member: true },
    });

    if (!subscription || subscription.status !== "FROZEN") {
      return { success: false, error: "الاشتراك غير مجمد حالياً" };
    }

    const activeFreeze = await prisma.subscriptionFreeze.findFirst({
      where: { subscriptionId, unfreezeDate: null },
      orderBy: { createdAt: "desc" },
    });

    if (!activeFreeze) {
      return { success: false, error: "لم يتم العثور على سجل تجميد نشط" };
    }

    const unfreezeDate = new Date();
    // Calculate frozen days
    const frozenDays = differenceInDays(unfreezeDate, activeFreeze.startDate);
    
    // Extend subscription endDate by frozenDays
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + frozenDays);

    await prisma.$transaction(async (tx) => {
      await tx.subscriptionFreeze.update({
        where: { id: activeFreeze.id },
        data: {
          unfreezeDate,
          frozenDays,
        },
      });

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          endDate: newEndDate,
          status: "ACTIVE",
        },
      });

      await tx.member.update({
        where: { id: subscription.memberId },
        data: { status: "ACTIVE" },
      });

      await tx.auditLog.create({
        data: {
          actionType: "SUBSCRIPTION_UNFROZEN",
          message: `تم إلغاء تجميد اشتراك العضو ${subscription.member.fullName}. تم تمديد الاشتراك بمقدار ${frozenDays} يوم.`,
          memberId: subscription.memberId,
          oldData: { status: "FROZEN", endDate: subscription.endDate },
          newData: { status: "ACTIVE", endDate: newEndDate, frozenDays },
          performedById: userId,
        },
      });
    });

    revalidatePath("/subscriptions");
    return { success: true };
  } catch (error) {
    console.error("Failed to unfreeze", error);
    return { success: false, error: "فشل في إلغاء التجميد" };
  }
}
