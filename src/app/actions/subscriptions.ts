"use server";

import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

export async function getActiveSubscriptions() {
  const settings = await prisma.gymSettings.findUnique({ where: { id: "singleton" } });
  const expirationThreshold = settings?.expirationThreshold || 7;
  const gymName = settings?.gymName || "النادي الرياضي";

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: ["ACTIVE", "EXPIRED", "FROZEN"],
      },
    },
    include: {
      member: true,
    },
    orderBy: {
      endDate: "asc",
    },
  });

  const now = new Date();
  
  return subscriptions.map(sub => {
    const remainingDays = differenceInDays(new Date(sub.endDate), now);
    
    let displayStatus: string = sub.status;
    if (sub.status !== "FROZEN") {
      if (remainingDays < 0) {
        displayStatus = "EXPIRED";
      } else if (remainingDays <= expirationThreshold) {
        displayStatus = "EXPIRING_SOON";
      } else {
        displayStatus = "ACTIVE";
      }
    }

    return {
      id: sub.id,
      memberId: sub.member.id,
      membershipId: sub.member.membershipId,
      memberName: sub.member.fullName,
      phone: sub.member.phone,
      startDate: sub.startDate,
      endDate: sub.endDate,
      durationMonths: sub.durationMonths,
      remainingDays,
      status: displayStatus,
      gymName,
    };
  });
}

export async function getExpiringSubscriptions() {
  const allSubs = await getActiveSubscriptions();
  return allSubs.filter(sub => sub.status === "EXPIRING_SOON");
}

export async function getExpiredSubscriptions() {
  const allSubs = await getActiveSubscriptions();
  return allSubs.filter(sub => sub.status === "EXPIRED");
}
