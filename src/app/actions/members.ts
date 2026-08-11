"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import { getCurrentUserId } from "./auth";

// Generates a unique membership ID like GYM-000001
async function generateMembershipId() {
  const lastMember = await prisma.member.findFirst({
    orderBy: { membershipId: 'desc' },
  });

  if (!lastMember) {
    return "GYM-000001";
  }

  const lastIdNum = parseInt(lastMember.membershipId.replace("GYM-", ""), 10);
  const nextIdNum = lastIdNum + 1;
  return `GYM-${nextIdNum.toString().padStart(6, '0')}`;
}

export async function addMemberWithSubscription(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const secondaryPhone = formData.get("secondaryPhone") as string;
    const gender = formData.get("gender") as string;
    const dobString = formData.get("dob") as string;
    const notes = formData.get("notes") as string;
    
    const startDateString = formData.get("startDate") as string;
    const durationMonths = parseInt(formData.get("durationMonths") as string);
    const priceString = formData.get("price") as string;
    const price = priceString ? parseFloat(priceString) : null;

    if (!fullName || !phone || !durationMonths) {
      return { success: false, error: "الاسم ورقم الهاتف ومدة الاشتراك مطلوبة" };
    }

    const existingPhone = await prisma.member.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return { success: false, error: "رقم الهاتف مستخدم مسبقاً لعضو آخر" };
    }

    const membershipId = await generateMembershipId();
    const startDate = startDateString ? new Date(startDateString) : new Date();
    // Calculate end date based on duration
    const endDate = addMonths(startDate, durationMonths);
    
    let dob = null;
    if (dobString) {
      dob = new Date(dobString);
    }

    // Using Prisma Transaction to ensure both Member and Subscription are created together
    await prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          membershipId,
          fullName,
          phone,
          secondaryPhone: secondaryPhone || null,
          gender: gender || null,
          dob,
          notes: notes || null,
          status: "ACTIVE",
          // In a real app with proper auth session, set createdById
        },
      });

      await tx.subscription.create({
        data: {
          memberId: member.id,
          startDate,
          endDate,
          durationMonths,
          price,
          status: "ACTIVE",
        },
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          actionType: "MEMBER_CREATED",
          message: `تم إضافة العضو الجديد ${fullName} مع اشتراك لمدة ${durationMonths} أشهر.`,
          memberId: member.id,
          newData: {
            membershipId,
            fullName,
            phone,
            subscription: { startDate, endDate, durationMonths }
          },
          performedById: userId,
        }
      });
    });

    revalidatePath("/subscriptions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to add member", error);
    return { success: false, error: "تعذر حفظ العضو والاشتراك. يرجى المحاولة مرة أخرى." };
  }
}
