"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="relative mx-auto flex h-[calc(100vh-4rem)] max-w-2xl w-full flex-col">
          <main className="flex flex-1 px-2 flex-col items-center justify-center text-center">
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
        </div>
      </body>
    </html>
  );
}
