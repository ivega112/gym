import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

export async function GET(request: Request) {
  // Check authorization for cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (
    process.env.NODE_ENV === "production" &&
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.gymSettings.findUnique({
      where: { id: "singleton" },
    });

    const archiveThreshold = settings?.archiveThreshold || 17;

    // Get all expired subscriptions that are still marked as EXPIRED (or ACTIVE but actually expired)
    // Wait, the status is calculated on the fly in the UI, but in DB it's mostly ACTIVE or EXPIRED or FROZEN.
    // We should find members who don't have ANY active or frozen subscriptions,
    // and their latest subscription ended more than `archiveThreshold` days ago.
    
    // Simplification: query all subscriptions that are not frozen, find members where their latest subscription is older than threshold.
    const allMembers = await prisma.member.findMany({
      where: {
        status: { not: "ARCHIVED" },
      },
      include: {
        subscriptions: {
          orderBy: { endDate: "desc" },
          take: 1, // Only care about the latest subscription
        },
      },
    });

    const now = new Date();
    let archivedCount = 0;

    for (const member of allMembers) {
      if (member.subscriptions.length > 0) {
        const latestSub = member.subscriptions[0];
        
        // If it's frozen, do not archive
        if (latestSub.status === "FROZEN") continue;

        const daysSinceExpired = differenceInDays(now, new Date(latestSub.endDate));
        
        if (daysSinceExpired >= archiveThreshold) {
          await prisma.$transaction(async (tx) => {
            // Update Member to ARCHIVED
            await tx.member.update({
              where: { id: member.id },
              data: { status: "ARCHIVED" },
            });

            // Update Subscription if it wasn't already EXPIRED
            if (latestSub.status !== "EXPIRED") {
              await tx.subscription.update({
                where: { id: latestSub.id },
                data: { status: "EXPIRED" },
              });
            }

            // Create Audit Log
            await tx.auditLog.create({
              data: {
                actionType: "MEMBER_ARCHIVED_AUTO",
                message: `تم أرشفة العضو ${member.fullName} تلقائياً لمرور ${daysSinceExpired} يوماً على انتهاء اشتراكه.`,
                memberId: member.id,
                newData: { status: "ARCHIVED", reason: "CRON_AUTO_ARCHIVE", daysSinceExpired },
              },
            });
          });
          
          archivedCount++;
        }
      }
    }

    // Also: 14-day Audit Log Auto-Deletion Rule (as mentioned in the original plan)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const deletedLogs = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: fourteenDaysAgo,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Archived ${archivedCount} members. Deleted ${deletedLogs.count} old audit logs.`,
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
