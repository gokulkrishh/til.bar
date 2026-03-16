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
      <body className="antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-left">
          <div className="flex w-full max-w-2xl flex-col gap-3">
            <h2 className="text-balance text-2xl font-semibold tracking-tight">
              Something went wrong
            </h2>
            <p className="max-w-md text-balance text-base leading-relaxed text-neutral-500">
              {error.message || "An unexpected error occurred."}
            </p>

            <Button size="lg" className="w-fit" onClick={reset}>
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
