"use client";

export function ChatInput() {
  return (
    <div className="fixed inset-x-0 bottom-2 bg-background">
      <div className="mx-auto flex flex-col gap-2 max-w-2xl px-6">
        <p className="text-center text-xs text-muted-foreground">
          Paste a URL anywhere to save it.
        </p>
        <input
          type="text"
          placeholder="Ask about your links..."
          className="h-12 w-full rounded-full border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
