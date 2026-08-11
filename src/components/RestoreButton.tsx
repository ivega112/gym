"use client";

import { useState, useRef } from "react";
import { restoreFromBackup } from "@/app/actions/backup";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RestoreButton({ className }: { className?: string }) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert("Please upload a valid JSON backup file (.json)");
      return;
    }

    setIsRestoring(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await restoreFromBackup(formData);
    setIsRestoring(false);

    if (result.success) {
      alert("System restored successfully!");
      setOpen(false);
      window.location.reload();
    } else {
      alert(result.error || "System restore failed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" className={className} />}>
        <Upload className="ml-2 h-4 w-4" />
        SYSTEM RESTORE (JSON)
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center uppercase font-bold tracking-wider">
            <AlertTriangle className="mr-2 h-5 w-5" />
            DATA RECOVERY
          </DialogTitle>
          <DialogDescription className="pt-2 text-left">
            This action will <strong>PERMANENTLY DELETE ALL CURRENT DATA</strong> and replace it with the records from the uploaded JSON backup file.
            <br /><br />
            Are you absolutely sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start gap-2 mt-4">
          <div>
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="destructive"
              disabled={isRestoring}
              onClick={() => fileInputRef.current?.click()}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  RESTORING...
                </>
              ) : (
                "YES, UPLOAD & RESTORE"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
