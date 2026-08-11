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

    try {
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
        
        // Dynamic imports for PDF generation
        const { toPng } = await import("html-to-image");
        const { jsPDF } = await import("jspdf");

        const element = document.createElement("div");
        element.innerHTML = reportResult.data;
        // MUST set rtl since innerHTML strips the <html> tag
        element.dir = "rtl";
        // Put in viewport but hide it to avoid blank render in html-to-image
        element.style.position = "fixed";
        element.style.top = "0px";
        element.style.left = "0px";
        element.style.width = "800px";
        element.style.zIndex = "-9999";
        element.style.opacity = "0.01"; // completely 0 opacity sometimes gets skipped by rendering engines
        element.style.pointerEvents = "none";
        element.style.backgroundColor = "#ffffff";
        document.body.appendChild(element);

        // Wait a moment for the Cairo font to load and browser to paint
        await new Promise(r => setTimeout(r, 1000));

        let pdfBlob;
        try {
          const dataUrl = await toPng(element, { 
            pixelRatio: 2, 
            quality: 0.98,
            skipFonts: false,
            cacheBust: true
          });
          
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: "a4" // A4 size: 595.28 x 841.89 pt
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
          
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdfBlob = pdf.output("blob");
        } catch (err: any) {
          document.body.removeChild(element);
          throw new Error("Failed to generate PDF: " + err.message);
        }
        
        document.body.removeChild(element);
        
        // Add the generated PDF file to the ZIP
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
          alert("تم استخراج النسخة والتقرير بنجاح.");
        }
        
        // Reload page to clear warnings
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } else {
        alert(backupResult.error || reportResult.error || "فشل في توليد النسخة الاحتياطية أو التقرير");
      }
    } catch (e: any) {
      alert("Error during backup: " + e.message);
      console.error(e);
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
