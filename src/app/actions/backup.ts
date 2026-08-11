/* eslint-disable */
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "./auth";

export async function generateBackup() {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        users: await prisma.user.findMany(),
        members: await prisma.member.findMany(),
        subscriptions: await prisma.subscription.findMany(),
        renewals: await prisma.subscriptionRenewal.findMany(),
        freezes: await prisma.subscriptionFreeze.findMany(),
        settings: await prisma.gymSettings.findMany(),
        logs: await prisma.auditLog.findMany(),
        backupRecords: await prisma.backupRecord.findMany(),
      }
    };

    const base64Data = Buffer.from(JSON.stringify(backupData, null, 2)).toString("base64");
    const settings = await prisma.gymSettings.findUnique({ where: { id: "singleton" } });

    await prisma.backupRecord.create({
      data: {
        fileName: `backup_${new Date().toISOString().split('T')[0]}.json`,
        status: "GENERATED",
      }
    });

    return { 
      success: true, 
      fileData: base64Data,
      whatsappNumber: settings?.whatsappNumber || ""
    };
  } catch (error) {
    console.error("Backup generation failed", error);
    return { success: false, error: "System encountered an error generating backup." };
  }
}

export async function restoreFromBackup(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file selected." };

    if (!file.name.endsWith('.json')) {
      return { success: false, error: "Invalid file format. Please upload a .json backup." };
    }

    const fileContent = await file.text();
    let parsed: any;
    try {
      parsed = JSON.parse(fileContent);
    } catch (e) {
      return { success: false, error: "Invalid JSON format in the backup file." };
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return { success: false, error: "Malformed backup data. Missing 'data' object." };
    }

    // Execute atomic restore
    await prisma.$transaction(async (tx) => {
      // 1. Clear existing data in reverse relation order to respect foreign keys
      await tx.auditLog.deleteMany();
      await tx.backupRecord.deleteMany();
      await tx.subscriptionFreeze.deleteMany();
      await tx.subscriptionRenewal.deleteMany();
      await tx.subscription.deleteMany();
      await tx.member.deleteMany();
      await tx.gymSettings.deleteMany();
      await tx.user.deleteMany();

      // 2. Insert records in correct order
      if (parsed.data.users?.length) await tx.user.createMany({ data: parsed.data.users });
      if (parsed.data.settings?.length) await tx.gymSettings.createMany({ data: parsed.data.settings });
      if (parsed.data.members?.length) await tx.member.createMany({ data: parsed.data.members });
      if (parsed.data.subscriptions?.length) await tx.subscription.createMany({ data: parsed.data.subscriptions });
      if (parsed.data.renewals?.length) await tx.subscriptionRenewal.createMany({ data: parsed.data.renewals });
      if (parsed.data.freezes?.length) await tx.subscriptionFreeze.createMany({ data: parsed.data.freezes });
      if (parsed.data.backupRecords?.length) await tx.backupRecord.createMany({ data: parsed.data.backupRecords });
      if (parsed.data.logs?.length) await tx.auditLog.createMany({ data: parsed.data.logs });

      await tx.auditLog.create({
        data: {
          actionType: "SYSTEM_RESTORE",
          message: "تم استعادة النظام من نسخة احتياطية.",
          newData: { fileDate: parsed.data.settings?.timestamp },
          performedById: userId,
        },
      });
    });

    return { success: true, message: "System restored successfully." };
  } catch (error: any) {
    console.error("Restore failed:", error);
    return { success: false, error: "Restore failed: " + (error.message || "") };
  }
}
