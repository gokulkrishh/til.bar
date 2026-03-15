export function EmptyState() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-2 flex-col items-center justify-center text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <h2 className="text-foreground text-balance text-3xl font-semibold tracking-tight">
        Capture your first learning.
      </h2>
      <p className="text-muted-foreground">
        Paste a URL anywhere to get started.
      </p>
    </div>
  );
}
