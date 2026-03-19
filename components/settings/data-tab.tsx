"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { exportTils, deleteAccount } from "@/app/actions/account";
import { toast } from "sonner";
import { Check, Copy, Download, Trash2, Upload } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { parseImportJson, IMPORT_PROMPT } from "@/lib/ai-import";
import type { ImportLink } from "@/lib/ai-import";
import { ImportPreview } from "./import-preview";

export function DataTab({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isExporting, startExportTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewLinks, setPreviewLinks] = useState<ImportLink[] | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(IMPORT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    startExportTransition(async () => {
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
      toast.success("Links exported");
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const { data, error } = parseImportJson(content);

    if (error) {
      toast.error(error);
    }

    if (data?.length) {
      setPreviewLinks(data);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteAccount = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    startDeleteTransition(async () => {
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

  if (previewLinks) {
    return (
      <ImportPreview
        links={previewLinks}
        onClose={() => setPreviewLinks(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 px-1">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Import links</h3>
            <p className="text-xs text-muted-foreground">
              Copy prompt, paste with your data into any AI, upload the result.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload />
              Upload JSON
            </Button>
          </div>
        </div>

        <div className="relative mt-2">
          <pre className="text-xs leading-relaxed bg-muted rounded-md p-3 pr-10 overflow-x-auto max-h-32 whitespace-pre-wrap text-muted-foreground select-all">
            {IMPORT_PROMPT.trim()}
          </pre>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Copy prompt"
            className="absolute top-1.5 right-1.5 size-7"
            onClick={handleCopyPrompt}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Export links</h3>
          <p className="text-xs text-muted-foreground">
            Download all your links as JSON
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? <Spinner /> : <Download />}
          Export
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-destructive">
            Delete account
          </h3>
          <p className="text-xs text-muted-foreground">
            Permanently deletes all your links and account data
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Trash2 />
          {confirmDelete ? "Delete account? This can't be undone" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
