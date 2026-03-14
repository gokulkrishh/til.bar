"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { exportTils, deleteAccount } from "@/app/actions/account";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";

export function DataTab({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportTils();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `til-bar-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    });
  };

  const handleDeleteAccount = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    startTransition(async () => {
      const result = await deleteAccount();
      if (result.error) {
        toast.error(result.error);
        setConfirmDelete(false);
        return;
      }

      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Export links</h3>
          <p className="text-xs text-muted-foreground">
            Download all your links as JSON
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isPending}>
          <Download />
          Export
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-destructive">
            Delete account
          </h3>
          <p className="text-xs text-muted-foreground">
            This removes all your links and account
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleDeleteAccount}
          disabled={isPending}
        >
          <Trash2 />
          {confirmDelete ? "Are you sure?" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
