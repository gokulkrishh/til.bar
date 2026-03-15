"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 px-2 flex-col items-center justify-center text-left">
      <div className="flex w-full flex-col gap-3">
        <h2 className="text-foreground text-balance text-2xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-balance max-w-md text-base leading-relaxed">
          {error.message || "An unexpected error occurred."}
        </p>

        <Button size="lg" className="w-fit" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
