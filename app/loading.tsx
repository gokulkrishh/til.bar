function SkeletonItem() {
  return (
    <li className="flex h-11.25 items-center gap-4 py-1">
      <div className="flex items-center gap-2 min-w-0 w-full">
        <div className="size-4 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-52 rounded-full bg-muted animate-pulse" />
      </div>
    </li>
  );
}

function SkeletonGroup() {
  return (
    <section>
      <div className="h-4 w-24 rounded bg-muted animate-pulse my-2" />
      <ul className="flex flex-col gap-0.5">
        <SkeletonItem />
        <SkeletonItem />
        <SkeletonItem />
      </ul>
    </section>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 py-4 pb-20">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="h-6 w-16 border border-muted rounded-full bg-muted animate-pulse" />
        <div className="h-6 w-20 border border-muted rounded-full bg-muted animate-pulse" />
        <div className="h-6 w-14 border border-muted rounded-full bg-muted animate-pulse" />
        <div className="h-6 w-18 border border-muted rounded-full bg-muted animate-pulse" />
      </div>
      <SkeletonGroup />
      <SkeletonGroup />
    </div>
  );
}
