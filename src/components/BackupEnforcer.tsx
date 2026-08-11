/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { checkBackupEnforcement } from "@/app/actions/backup-check";
import { BackupButton } from "@/components/BackupButton";
import { ShieldAlert } from "lucide-react";

export function BackupEnforcer() {
  const [enforced, setEnforced] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackupEnforcement().then((res) => {
      setEnforced(res.isEnforced);
      setLoading(false);
    });
  }, []);

  if (loading || !enforced) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center" dir="rtl">
        <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 font-cairo tracking-tight">إجراء أمني إلزامي</h2>
        <p className="text-gray-600 mb-8 font-cairo leading-relaxed">
          لم يتم أخذ نسخة احتياطية للنظام منذ 5 أيام أو أكثر.<br />
          لضمان سلامة البيانات وحمايتها من الضياع، يتوجب عليك أخذ نسخة احتياطية الآن قبل المتابعة.
        </p>
        <div className="flex justify-center" onClick={() => {
          setTimeout(() => {
            checkBackupEnforcement().then(res => setEnforced(res.isEnforced));
          }, 5000);
        }}>
          <BackupButton className="w-full text-lg py-6 shadow-md" />
        </div>
      </div>
    </div>
  );
}
