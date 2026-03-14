import { Loader2 } from "lucide-react";
import { Spinner } from "./ui/spinner";

export function TilItemSkeleton({ url }: { url: string }) {
  return (
    <li className="flex h-10.25 items-center gap-4 py-1.5">
      <div className="flex items-center gap-2 min-w-0 w-full">
        <Spinner className="size-3.5" />
        <span className="text-sm font-medium truncate animate-pulse">
          {url}
        </span>
      </div>
    </li>
  );
}
