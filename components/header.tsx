"use client";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google";
import { UserMenu } from "@/components/user-menu";

export function Header({ user }: { user: User | null }) {
  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  };

  return (
    <header className="flex items-center justify-between py-5">
      <h1 className="font-mono text-lg font-semibold tracking-tight">
        til{" "}
        <span className="text-sm font-normal text-muted-foreground">
          — today i learned
        </span>
      </h1>
      {user ? (
        <UserMenu user={user} />
      ) : (
        <Button size="lg" variant="outline" onClick={handleSignIn}>
          <GoogleIcon />
          Sign in
        </Button>
      )}
    </header>
  );
}
