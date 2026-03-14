export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-lg font-medium text-foreground">No TILs yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a URL anywhere to capture your first link.
      </p>
    </div>
  );
}
