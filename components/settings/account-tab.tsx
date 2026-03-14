"use client";

import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AccountTab({ user }: { user: User }) {
  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name ?? "";
  const email = user.email ?? "";

  return (
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
  );
}
