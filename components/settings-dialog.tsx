"use client";

import type { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AccountTab } from "@/components/settings/account-tab";
import { AppearanceTab } from "@/components/settings/appearance-tab";
import { McpTab } from "@/components/settings/mcp-tab";
import { DataTab } from "@/components/settings/data-tab";

export function SettingsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl pb-4">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="account" className="min-h-0 flex flex-col">
          <TabsList variant="line">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
            <TabsTrigger value="data">Data control</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <AccountTab user={user} />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="mcp">
            <McpTab />
          </TabsContent>
          <TabsContent value="data">
            <DataTab onOpenChange={onOpenChange} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
