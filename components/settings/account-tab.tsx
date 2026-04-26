"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ImportPreview } from "./import-preview";
import { cn, getInitials } from "@/lib/utils";
import { exportTils, deleteAccount } from "@/app/actions/account";
import { setEmailDigestEnabled } from "@/app/actions/preferences";
import { parseImportJson, IMPORT_PROMPT } from "@/lib/ai-import";
import type { ImportLink } from "@/lib/ai-import";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Trash2,
  Upload,
} from "lucide-react";

export function AccountTab({
  user,
  emailDigestEnabled,
  onOpenChange,
}: {
  user: User;
  emailDigestEnabled: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name ?? "";
  const email = user.email ?? "";

  const [isExporting, startExportTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isTogglingDigest, startDigestTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewLinks, setPreviewLinks] = useState<ImportLink[] | null>(null);
  const [importExpanded, setImportExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(emailDigestEnabled);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDigestToggle = (next: boolean) => {
    const prev = digestEnabled;
    setDigestEnabled(next);
    startDigestTransition(async () => {
      const result = await setEmailDigestEnabled(next);
      if (result.error) {
        setDigestEnabled(prev);
        toast.error(result.error);
        return;
      }
      toast.success(
        next ? "Weekly digest turned on" : "Weekly digest turned off",
      );
    });
  };

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
    <div className="flex flex-col gap-6 py-4 px-1 overflow-x-hidden">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={avatarUrl} alt={fullName} />
          <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">{fullName}</span>
          <span className="text-xs text-muted-foreground truncate">
            {email}
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Weekly reflection</h3>
            <p className="text-xs text-muted-foreground">
              AI summary of your weekly saves. Sent on Mondays.
            </p>
          </div>
          <Switch
            checked={digestEnabled}
            disabled={isTogglingDigest}
            onCheckedChange={handleDigestToggle}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data
        </h2>
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between cursor-pointer"
            onClick={() => setImportExpanded((v) => !v)}
          >
            <div className="text-left">
              <h3 className="text-sm font-semibold">Import links</h3>
              <p className="text-xs text-muted-foreground">
                Copy prompt, paste with your data into any AI, upload the
                result.
              </p>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                { "-rotate-180": importExpanded },
              )}
            />
          </button>

          {importExpanded && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="relative">
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
              <div className="flex justify-end">
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
          )}
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
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-destructive">
          Danger zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Delete account</h3>
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
      </section>
    </div>
  );
}
