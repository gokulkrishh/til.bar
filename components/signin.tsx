"use client";

import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "./icons/google";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { useState } from "react";

export default function SignIn() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
    } catch (error) {
      console.error("Error during sign-in:", error);
      setLoading(false);
    }
  };

  return (
    <Button size="lg" variant="outline" onClick={handleSignIn}>
      {loading ? <Spinner /> : <GoogleIcon aria-hidden="true" />}
      Sign in
    </Button>
  );
}
