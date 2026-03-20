"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, LogOut, Settings } from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";

export function Profile({ user }: { user: User }) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    // Clear service worker cache
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));

    router.refresh();
  };

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name ?? user.email ?? "";
  const initials = getInitials(fullName);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Account menu">
          <Avatar className="size-9 hit-area-2">
            <AvatarImage
              className="object-contain"
              src={avatarUrl}
              alt={fullName}
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={
              <a
                href="https://github.com/gokulkrishh"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Github aria-hidden="true" />
            GitHub
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings aria-hidden="true" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsDialog
        user={user}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
