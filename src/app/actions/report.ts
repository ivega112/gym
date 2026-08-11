/* eslint-disable */
"use server";

import { prisma } from "@/lib/prisma";

export async function generateDailyReportPdf() {
  try {
    const today = new Date();
    
    // Fetch statistics for the report
    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { member: true },
    });
    
    const frozenSubs = await prisma.subscription.findMany({
      where: { status: "FROZEN" },
      include: { member: true },
    });
    
    const expiredSubs = await prisma.subscription.findMany({
      where: { status: "EXPIRED" },
      include: { member: true },
    });

    const reportData = {
      date: today.toISOString(),
      activeSubs: activeSubs.map(s => ({
        membershipId: s.member.membershipId,
        fullName: s.member.fullName,
        phone: s.member.phone,
        endDate: s.endDate.toISOString()
      })),
      frozenSubs: frozenSubs.map(s => ({
        membershipId: s.member.membershipId,
        fullName: s.member.fullName,
        phone: s.member.phone
      })),
      expiredSubs: expiredSubs.map(s => ({
        membershipId: s.member.membershipId,
        fullName: s.member.fullName,
        phone: s.member.phone,
        endDate: s.endDate.toISOString()
      }))
    };

    return { success: true, data: reportData };
  } catch (error: any) {
    console.error("Data Fetch Error:", error);
    return { success: false, error: "Failed to fetch report data: " + (error.message || "") };
  }
}
