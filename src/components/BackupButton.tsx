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

        // Initialize ZIP
        const zip = new JSZip();
        
        // 1. Add the JSON backup to ZIP
        zip.file("backup.json", base64ToUint8Array(backupResult.fileData));
        
        // 2. Generate PDF using jspdf and jspdf-autotable
        const { jsPDF } = await import("jspdf");
        const autoTable = (await import("jspdf-autotable")).default;

        const doc = new jsPDF();
        
        // Fetch and load Arabic font to fix gibberish characters
        try {
          const fontRes = await fetch('/fonts/amiri.ttf');
          const fontBuffer = await fontRes.arrayBuffer();
          // Convert ArrayBuffer to Base64
          const uint8Array = new Uint8Array(fontBuffer);
          let binaryString = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          const base64Font = btoa(binaryString);
          
          doc.addFileToVFS('Amiri.ttf', base64Font);
          doc.addFont('Amiri.ttf', 'Amiri', 'normal');
          doc.setFont('Amiri');
        } catch (fontErr) {
          console.warn("Could not load Arabic font", fontErr);
        }

        const data = reportResult.data as any; // Type assertion since it's raw JSON now
        
        // Document Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("GYM SYSTEM REPORT", 105, 20, { align: "center" });
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Date: ${dateStr}`, 105, 30, { align: "center" });

        // Helper to generate tables
        let startY = 40;
        
        const createTable = (title: string, columns: string[], rows: any[]) => {
          if (rows.length === 0) return;
          
          doc.setFontSize(16);
          doc.setTextColor(20, 20, 20);
          doc.setFont('Amiri'); // Apply Arabic font to title too
          doc.text(title, 14, startY + 10);
          
          autoTable(doc, {
            startY: startY + 15,
            head: [columns],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [31, 78, 121], textColor: 255, font: 'Amiri', halign: 'right' },
            styles: { font: "Amiri", fontSize: 10, halign: 'right' },
            margin: { left: 14, right: 14 },
          });
          
          startY = (doc as any).lastAutoTable.finalY + 10;
        };

        // Active Subscriptions Table
        const activeRows = data.activeSubs.map((s: any) => [
          s.membershipId, 
          s.fullName, 
          s.phone, 
          new Date(s.endDate).toLocaleDateString()
        ]);
        createTable("Active Subscriptions", ["ID", "Name", "Phone", "End Date"], activeRows);

        // Frozen Subscriptions Table
        const frozenRows = data.frozenSubs.map((s: any) => [
          s.membershipId, 
          s.fullName, 
          s.phone
        ]);
        createTable("Frozen Subscriptions", ["ID", "Name", "Phone"], frozenRows);

        // Expired Subscriptions Table
        const expiredRows = data.expiredSubs.map((s: any) => [
          s.membershipId, 
          s.fullName, 
          s.phone, 
          new Date(s.endDate).toLocaleDateString()
        ]);
        createTable("Expired Subscriptions", ["ID", "Name", "Phone", "End Date"], expiredRows);

        // Get PDF Blob
        const pdfBlob = doc.output("blob");
        
        // Add PDF to ZIP
        zip.file("daily_gym_report.pdf", pdfBlob);
        
        // 3. Trigger ZIP Download
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(zipBlob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `Gym_Backup_${dateStr}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // 4. Open WhatsApp Dispatch
        if (backupResult.whatsappNumber) {
          const text = `تم تجهيز ملف النسخة الاحتياطية الشامل (ZIP) والذي يحتوي على التقرير (PDF) وبيانات النظام (JSON). يرجى إرفاق الملف هنا لحفظه.`;
          const cleanNumber = backupResult.whatsappNumber.replace(/\D/g, '').replace(/^0/, '966');
          const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
          window.open(waUrl, "_blank");
        } else {
          alert("تم استخراج النسخة والتقرير بنجاح.");
        }
        
        // Reload page to clear state
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
