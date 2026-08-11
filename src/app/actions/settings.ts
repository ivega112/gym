"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "./auth";

export async function getGymSettings() {
  let settings = await prisma.gymSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) {
    settings = await prisma.gymSettings.create({
      data: {
        id: "singleton",
        gymName: "النادي الرياضي",
      },
    });
  }

  return settings;
}

export async function updateGymSettings(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    const gymName = formData.get("gymName") as string;
    const gymPhone = formData.get("gymPhone") as string;
    const whatsappNumber = formData.get("whatsappNumber") as string;
    const expirationThreshold = parseInt(formData.get("expirationThreshold") as string) || 7;
    const archiveThreshold = parseInt(formData.get("archiveThreshold") as string) || 17;

    const updatedSettings = await prisma.gymSettings.upsert({
      where: { id: "singleton" },
      update: {
        gymName,
        gymPhone,
        whatsappNumber,
        expirationThreshold,
        archiveThreshold,
      },
      create: {
        id: "singleton",
        gymName,
        gymPhone,
        whatsappNumber,
        expirationThreshold,
        archiveThreshold,
      },
    });

    await prisma.auditLog.create({
      data: {
        actionType: "SETTINGS_UPDATED",
        message: "تم تحديث إعدادات النظام.",
        newData: { 
          gymName, gymPhone, whatsappNumber, 
          expirationThreshold, archiveThreshold 
        },
        performedById: userId,
      }
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update gym settings", error);
    return { success: false, error: "فشل في تحديث الإعدادات" };
  }
}
