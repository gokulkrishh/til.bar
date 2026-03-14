"use client";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google";

export function Header() {
  return (
    <header className="flex items-center justify-between py-5">
      <h1 className="font-mono text-lg font-semibold tracking-tight">
        til{" "}
        <span className="text-sm font-normal text-muted-foreground">
          — today i learned
        </span>
      </h1>
      <Button size="lg" variant="outline" onClick={() => {}}>
        <GoogleIcon />
        Sign in
      </Button>
    </header>
  );
}
