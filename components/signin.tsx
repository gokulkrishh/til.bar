"use client";

import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "./icons/google";
import { Button } from "./ui/button";

export default function SignIn() {
  const supabase = createClient();

  const handleSignIn = async () => {
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
    <Button size="lg" variant="outline" onClick={handleSignIn}>
      <GoogleIcon />
      Sign in
    </Button>
  );
}
