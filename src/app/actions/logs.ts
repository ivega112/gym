"use server";

import { prisma } from "@/lib/prisma";

export async function getAuditLogs() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    include: {
      member: {
        select: {
          fullName: true,
          membershipId: true,
        },
      },
      performedBy: {
        select: {
          fullName: true,
          username: true,
        },
      },
    },
    take: 500, // Limit to recent 500 logs to keep it performant
  });

  return logs.map((log) => ({
    id: log.id,
    actionType: log.actionType,
    message: log.message,
    oldData: log.oldData,
    newData: log.newData,
    timestamp: log.timestamp,
    performedBy: log.performedBy ? `${log.performedBy.fullName} (${log.performedBy.username})` : "النظام (تلقائي)",
    memberName: log.member?.fullName || "غير مرتبط",
  }));
}
