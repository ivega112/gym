"use client";

import { useState } from "react";
import JSZip from "jszip";
import { generateBackup } from "@/app/actions/backup";
import { generateDailyReportPdf } from "@/app/actions/report";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Loader2 } from "lucide-react";

export function BackupButton({ className }: { className?: string }) {
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    
    // Run both generations in parallel
    const [backupResult, reportResult] = await Promise.all([
      generateBackup(),
      generateDailyReportPdf()
    ]);
    
    setIsBackingUp(false);

    if (backupResult.success && backupResult.fileData && reportResult.success && reportResult.data) {
      const dateStr = new Date().toISOString().split("T")[0];
      
      // Helper to convert base64 to Uint8Array
      const base64ToUint8Array = (base64Str: string) => {
        const byteString = atob(base64Str);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        return uint8Array;
      };

      // Add the JSON backup to ZIP
      const zip = new JSZip();
      zip.file(`backup_${dateStr}.json`, base64ToUint8Array(backupResult.fileData));
      
      // Use html2pdf.js to generate the PDF from the HTML string locally
      // Ensure html2pdf is only imported on the client
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.createElement("div");
      element.innerHTML = reportResult.data;
      
      const opt = {
        margin: 0,
        filename: `daily_gym_report_${dateStr}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      
      // Add the generated PDF blob to the ZIP
      zip.file(`daily_gym_report_${dateStr}.pdf`, pdfBlob);
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipBlob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `gym_backup_and_report_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 3. Open WhatsApp if a number is configured
      if (backupResult.whatsappNumber) {
        const text = `تم تجهيز النسخة الاحتياطية (JSON) وتقرير الاشتراكات (PDF). يرجى إرفاق ملف الـ (ZIP) المضغوط في هذه المحادثة لحفظهما معاً.`;
        const cleanNumber = backupResult.whatsappNumber.replace(/\D/g, '').replace(/^0/, '966');
        const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, "_blank");
      } else {
        alert("Backup and Report generated successfully. No WhatsApp number configured.");
      }
      
      // Reload page to clear warnings
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } else {
      alert(backupResult.error || reportResult.error || "فشل في توليد النسخة الاحتياطية أو التقرير");
    }
  };

  return (
    <Button 
      onClick={handleBackup} 
      disabled={isBackingUp}
      className={className || "bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"}
    >
      {isBackingUp ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <DatabaseBackup className="ml-2 h-4 w-4" />
      )}
      {isBackingUp ? "جاري إنشاء النسخة..." : "إنشاء نسخة احتياطية (Take Backup)"}
    </Button>
  );
}
