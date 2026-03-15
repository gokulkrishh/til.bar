import { Spinner } from "./ui/spinner";

export function TilItemSkeleton({ url }: { url: string }) {
  return (
    <li className="flex h-11.25 items-center gap-4 py-1.5">
      <div className="flex items-center gap-2 min-w-0 w-full">
        <Spinner className="size-4" />
        <span className="text-sm font-medium truncate animate-pulse">
          {url}
        </span>
      </div>
    </li>
  );
}
