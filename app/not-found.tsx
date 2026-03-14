import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex flex-col gap-3">
        <h2 className="text-foreground text-balance text-2xl font-semibold tracking-tight">
          Page not found
        </h2>
        <p className="text-muted-foreground text-balance max-w-md text-base leading-relaxed">
          Unable to find the requested page.
        </p>
        <Link href="/">
          <Button className="w-fit self-center">Go to home</Button>
        </Link>
      </div>
    </main>
  );
}
