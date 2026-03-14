import { Kbd } from "./ui/kbd";

export function EmptyState() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-2 flex-col items-center justify-center text-center">
      <h2 className="text-foreground text-balance text-3xl font-semibold tracking-tight">
        Capture your first learning.
      </h2>
      <p className="text-muted-foreground">
        Paste a URL anywhere to get started.
      </p>
    </div>
  );
}
