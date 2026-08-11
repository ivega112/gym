/* eslint-disable */
"use server";

import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function generateDailyReportExcel() {
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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gym System';
    workbook.created = today;

    // Helper to style headers
    const styleHeader = (row: ExcelJS.Row) => {
      row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      row.alignment = { horizontal: 'center' };
    };

    // ACTIVE SUBSCRIPTIONS SHEET
    const activeSheet = workbook.addWorksheet('الاشتراكات النشطة', { views: [{ rightToLeft: true }] });
    activeSheet.columns = [
      { header: 'رقم العضوية', key: 'id', width: 15 },
      { header: 'الاسم', key: 'name', width: 30 },
      { header: 'رقم الجوال', key: 'phone', width: 20 },
      { header: 'تاريخ الانتهاء', key: 'end', width: 15 },
    ];
    styleHeader(activeSheet.getRow(1));
    activeSubs.forEach(s => {
      activeSheet.addRow({
        id: s.member.membershipId,
        name: s.member.fullName,
        phone: s.member.phone,
        end: new Date(s.endDate).toLocaleDateString('ar-SA')
      });
    });

    // FROZEN SUBSCRIPTIONS SHEET
    const frozenSheet = workbook.addWorksheet('الاشتراكات المجمدة', { views: [{ rightToLeft: true }] });
    frozenSheet.columns = [
      { header: 'رقم العضوية', key: 'id', width: 15 },
      { header: 'الاسم', key: 'name', width: 30 },
      { header: 'رقم الجوال', key: 'phone', width: 20 },
    ];
    styleHeader(frozenSheet.getRow(1));
    frozenSubs.forEach(s => {
      frozenSheet.addRow({
        id: s.member.membershipId,
        name: s.member.fullName,
        phone: s.member.phone
      });
    });

    // EXPIRED SUBSCRIPTIONS SHEET
    const expiredSheet = workbook.addWorksheet('الاشتراكات المنتهية', { views: [{ rightToLeft: true }] });
    expiredSheet.columns = [
      { header: 'رقم العضوية', key: 'id', width: 15 },
      { header: 'الاسم', key: 'name', width: 30 },
      { header: 'رقم الجوال', key: 'phone', width: 20 },
      { header: 'تاريخ الانتهاء', key: 'end', width: 15 },
    ];
    styleHeader(expiredSheet.getRow(1));
    expiredSubs.forEach(s => {
      expiredSheet.addRow({
        id: s.member.membershipId,
        name: s.member.fullName,
        phone: s.member.phone,
        end: new Date(s.endDate).toLocaleDateString('ar-SA')
      });
    });

    // SUMMARY SHEET
    const summarySheet = workbook.addWorksheet('ملخص', { views: [{ rightToLeft: true }] });
    summarySheet.columns = [
      { header: 'الحالة', key: 'status', width: 25 },
      { header: 'العدد', key: 'count', width: 15 },
    ];
    styleHeader(summarySheet.getRow(1));
    summarySheet.addRow({ status: 'الاشتراكات النشطة', count: activeSubs.length });
    summarySheet.addRow({ status: 'الاشتراكات المجمدة', count: frozenSubs.length });
    summarySheet.addRow({ status: 'الاشتراكات المنتهية', count: expiredSubs.length });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    return { success: true, data: base64Data };
  } catch (error: any) {
    console.error("Excel Generation Error:", error);
    return { success: false, error: "فشل إنشاء تقرير Excel: " + (error.message || "") };
  }
}
