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
import {
  Check,
  Copy,
  Download,
  Monitor,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundSettings } from "@/context/sound-provider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MCP_TOOLS } from "@/lib/mcp-tools";

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
  const { soundEnabled, setSoundEnabled } = useSoundSettings();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const mcpUrl = "https://til.bar/api/mcp";

  const handleCopyMcpUrl = async () => {
    await navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <DialogContent className="sm:max-w-xl pb-4 overflow-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="account">
          <TabsList variant="line">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Theme</h3>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <div className="flex border border-muted rounded-full p-0.75 w-fit">
                  {[
                    { value: "system", label: "System", icon: Monitor },
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      className={cn(
                        "rounded-full cursor-pointer p-1.25 hover:bg-muted",
                        {
                          "bg-primary text-white hover:bg-primary":
                            theme === value,
                        },
                      )}
                      key={value}
                      onClick={() => setTheme(value)}
                      aria-label={label}
                    >
                      <Icon className="size-3" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <div>
                  <h3 className="text-sm font-medium">Sound</h3>
                  <p className="text-xs text-muted-foreground">
                    Play sounds on actions
                  </p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={() => setSoundEnabled(!soundEnabled)}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="mcp">
            <div className="flex flex-col gap-4 py-4 px-1">
              <div>
                <h3 className="text-sm font-medium">MCP Server</h3>
                <p className="text-xs text-muted-foreground">
                  Connect AI tools like Claude or ChatGPT.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono truncate">
                  {mcpUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyMcpUrl}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-30">Tool</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MCP_TOOLS.map((tool) => (
                    <TableRow key={tool.name}>
                      <TableCell className="font-mono text-xs">
                        {tool.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tool.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
