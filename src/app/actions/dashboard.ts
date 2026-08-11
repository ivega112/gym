"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const settings = await prisma.gymSettings.findUnique({ where: { id: "singleton" } });
  
  const totalActive = await prisma.member.count({ where: { status: "ACTIVE" } });
  const expiringSoon = await prisma.member.count({ where: { status: "EXPIRING_SOON" } });
  const expired = await prisma.member.count({ where: { status: "EXPIRED" } });
  const frozen = await prisma.member.count({ where: { status: "FROZEN" } });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthSubs = await prisma.subscription.count({
    where: {
      createdAt: {
        gte: startOfMonth,
      }
    }
  });

  const todayStr = now.toISOString().split("T")[0];
  const todayBackup = await prisma.backupRecord.findFirst({
    where: {
      fileName: {
        contains: todayStr
      }
    }
  });

  const recentLogs = await prisma.auditLog.findMany({
    take: 5,
    orderBy: { timestamp: "desc" },
    include: { performedBy: true }
  });

  const expiringSoonList = await prisma.subscription.findMany({
    where: { member: { status: "EXPIRING_SOON" }, status: "ACTIVE" },
    include: { member: true },
    orderBy: { endDate: "asc" },
    take: 5,
  });

  return {
    totalActive,
    expiringSoon,
    expired,
    frozen,
    currentMonthSubs,
    hasBackupToday: !!todayBackup,
    recentLogs: recentLogs.map(log => ({
      id: log.id,
      action: log.actionType,
      message: log.message,
      time: log.timestamp.toLocaleString("ar-SA"),
      user: log.performedBy ? `${log.performedBy.fullName} (${log.performedBy.username})` : "نظام"
    })),
    expiringSoonList: expiringSoonList.map(sub => {
      const remainingTime = sub.endDate.getTime() - now.getTime();
      const remainingDays = Math.ceil(remainingTime / (1000 * 3600 * 24));
      return {
        id: sub.id,
        memberName: sub.member.fullName,
        phone: sub.member.phone,
        remainingDays,
      };
    }),
    settings
  };
}
