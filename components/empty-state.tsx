import { LinkIcon } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 flex-col items-center justify-center text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <div className="flex size-14 items-center justify-center bg-muted rounded-full p-2">
        <LinkIcon aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-balance text-2xl font-bold tracking-tight">
          Save your first link.
        </h2>
        <p className="text-muted-foreground">
          Paste a URL or use the browser extension.
        </p>
      </div>
    </div>
  );
}
