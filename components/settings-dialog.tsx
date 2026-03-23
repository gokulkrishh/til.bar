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
import { IntegrationsTab } from "@/components/settings/integrations-tab";
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
      <DialogContent className="sm:max-w-xl p-4">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="account" className="min-h-0 flex flex-col gap-0">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList variant="line">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="account" className="max-h-120 overflow-y-auto">
            <AccountTab user={user} onOpenChange={onOpenChange} />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
          <TabsContent
            value="integrations"
            className="max-h-120 overflow-y-auto"
          >
            <IntegrationsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
