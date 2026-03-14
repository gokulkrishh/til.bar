"use client";

import type { User } from "@supabase/supabase-js";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { exportTils, deleteAccount } from "@/app/actions/account";
import { toast } from "sonner";
import { Download, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name ?? "";
  const email = user.email ?? "";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg pb-4">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="data">Data control</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <div className="flex items-center gap-3 py-4 px-1">
              <Avatar className="size-10">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{fullName}</span>
                <span className="text-xs text-muted-foreground">{email}</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="appearance">
            <div className="flex flex-col gap-2 py-4 px-1">
              <div>
                <h3 className="text-sm font-medium">Theme</h3>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
              <div className="flex gap-2">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    className={cn(
                      "flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border px-2 py-3 text-sm transition-all active:scale-[0.97]",
                      theme === value
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                    )}
                    key={value}
                    onClick={() => setTheme(value)}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="data">
            <div className="flex flex-col gap-4 py-4 px-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Export links</h3>
                  <p className="text-xs text-muted-foreground">
                    Download all your links as JSON
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={isPending}
                >
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
