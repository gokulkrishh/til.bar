import { LinkIcon } from "lucide-react";
import SignIn from "@/components/signin";
import { TilList } from "./til-list";
import { DEMO_ITEMS } from "./data/demo";

export function DemoState() {
  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden py-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div
        className="pointer-events-none select-none max-h-80"
        aria-hidden="true"
      >
        <TilList tils={DEMO_ITEMS} />
      </div>

      <div className="absolute flex-1 inset-0 m-auto flex flex-col items-center justify-center bg-linear-to-t from-background via-background/95 to-background/60">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-14 items-center justify-center bg-muted rounded-full p-2">
            <LinkIcon aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-balance text-2xl font-bold tracking-tight">
              Your personal TIL log, organized by AI.
            </h1>
            <p className="text-muted-foreground">
              Save links from your browser, phone, or ask any AI.
            </p>
          </div>
          <SignIn />
        </div>
      </div>
    </div>
  );
}
