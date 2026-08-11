/* eslint-disable */
"use server";

import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

export async function checkBackupEnforcement() {
  try {
    const lastBackup = await prisma.backupRecord.findFirst({
      orderBy: { timestamp: "desc" },
    });
    
    if (!lastBackup) {
      return { isEnforced: true, daysSince: 999 };
    }
    
    const daysSince = differenceInDays(new Date(), lastBackup.timestamp);
    return { isEnforced: daysSince >= 5, daysSince };
  } catch (error) {
    console.error("Failed to check backup status", error);
    return { isEnforced: false, daysSince: 0 };
  }
}
