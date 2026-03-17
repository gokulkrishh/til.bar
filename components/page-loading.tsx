function SkeletonItem({ stagger = 1 }: { stagger?: 1 | 2 | 3 }) {
  const staggerClass =
    stagger === 1
      ? "skeleton-stagger-1"
      : stagger === 2
        ? "skeleton-stagger-2"
        : "skeleton-stagger-3";

  return (
    <li className="flex h-11.25 items-center gap-4 py-1">
      <div className="flex items-center gap-2 min-w-0 w-full">
        <div className={`size-4 rounded-lg bg-muted ${staggerClass}`} />
        <div className={`h-4 w-52 rounded-lg bg-muted ${staggerClass}`} />
      </div>
    </li>
  );
}

function SkeletonGroup() {
  return (
    <section>
      <div className="h-4 w-24 rounded bg-muted skeleton-stagger-1 my-2 mb-3" />
      <ul className="flex flex-col gap-0.5">
        <SkeletonItem stagger={1} />
        <SkeletonItem stagger={2} />
        <SkeletonItem stagger={3} />
      </ul>
    </section>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 py-4 pb-20">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="h-7 w-16 border border-muted rounded-full bg-muted skeleton-stagger-1" />
        <div className="h-7 w-20 border border-muted rounded-full bg-muted skeleton-stagger-2" />
        <div className="h-7 w-14 border border-muted rounded-full bg-muted skeleton-stagger-3" />
        <div className="h-7 w-18 border border-muted rounded-full bg-muted skeleton-stagger-1" />
      </div>
      <SkeletonGroup />
      <div className="flex border-t border-border/30 my-1 w-full"></div>
      <SkeletonGroup />
    </div>
  );
}
