/* eslint-disable */
"use server";

import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

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

    // Build the HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .english-title { font-family: sans-serif; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0; color: #111; }
          .arabic-subtitle { font-size: 16px; color: #666; margin-top: 10px; }
          h2 { color: #222; font-size: 20px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { border-collapse: collapse; margin-top: 15px; width: 100%; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background-color: #f9f9f9; font-weight: bold; }
          .metrics { display: flex; justify-content: space-around; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .metric-box { text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #0f172a; }
          .metric-label { font-size: 12px; color: #64748b; }
          .empty-state { text-align: center; color: #94a3b8; padding: 20px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="english-title">GYM SYSTEM REPORT</h1>
          <div class="arabic-subtitle">التقرير اليومي للاشتراكات - ${today.toLocaleDateString('ar-SA')}</div>
        </div>

        <div class="metrics">
          <div class="metric-box">
            <div class="metric-value">${activeSubs.length}</div>
            <div class="metric-label">اشتراكات نشطة</div>
          </div>
          <div class="metric-box">
            <div class="metric-value">${frozenSubs.length}</div>
            <div class="metric-label">اشتراكات مجمدة</div>
          </div>
          <div class="metric-box">
            <div class="metric-value">${expiredSubs.length}</div>
            <div class="metric-label">اشتراكات منتهية</div>
          </div>
        </div>

        <h2>الاشتراكات النشطة</h2>
        ${activeSubs.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>رقم العضوية</th>
              <th>الاسم</th>
              <th>رقم الجوال</th>
              <th>تاريخ الانتهاء</th>
            </tr>
          </thead>
          <tbody>
            ${activeSubs.map(s => `
              <tr>
                <td>${s.member.membershipId}</td>
                <td>${s.member.fullName}</td>
                <td>${s.member.phone}</td>
                <td>${new Date(s.endDate).toLocaleDateString('ar-SA')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<div class="empty-state">لا توجد اشتراكات نشطة.</div>'}

        <h2>الاشتراكات المجمدة</h2>
        ${frozenSubs.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>رقم العضوية</th>
              <th>الاسم</th>
              <th>رقم الجوال</th>
            </tr>
          </thead>
          <tbody>
            ${frozenSubs.map(s => `
              <tr>
                <td>${s.member.membershipId}</td>
                <td>${s.member.fullName}</td>
                <td>${s.member.phone}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<div class="empty-state">لا توجد اشتراكات مجمدة.</div>'}

        <h2>الاشتراكات المنتهية</h2>
        ${expiredSubs.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>رقم العضوية</th>
              <th>الاسم</th>
              <th>رقم الجوال</th>
              <th>تاريخ الانتهاء</th>
            </tr>
          </thead>
          <tbody>
            ${expiredSubs.map(s => `
              <tr>
                <td>${s.member.membershipId}</td>
                <td>${s.member.fullName}</td>
                <td>${s.member.phone}</td>
                <td>${new Date(s.endDate).toLocaleDateString('ar-SA')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<div class="empty-state">لا توجد اشتراكات منتهية.</div>'}
      </body>
      </html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      printBackground: true,
    });
    await browser.close();

    // Convert Uint8Array to base64 properly
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
    
    return { success: true, data: base64Pdf };
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return { success: false, error: "فشل إنشاء تقرير PDF: " + (error.message || "") };
  }
}
