function SkeletonItem({ stagger = 1 }: { stagger?: 1 | 2 | 3 }) {
  const staggerClass =
    stagger === 1
      ? "skeleton-stagger-1"
      : stagger === 2
        ? "skeleton-stagger-2"
        : "skeleton-stagger-3";

  return (
    <div className="flex items-center gap-1 min-w-0 w-full">
      <div className={`h-5 w-2/4 rounded-sm bg-muted ${staggerClass}`} />
    </div>
  );
}

export function SkeletonGroup() {
  return (
    <section className="w-full">
      <div className="h-4 w-24 rounded-sm bg-muted skeleton-stagger-1 my-2 mb-4" />
      <ul className="flex flex-col gap-4">
        <SkeletonItem stagger={1} />
        <SkeletonItem stagger={2} />
        <SkeletonItem stagger={3} />
      </ul>
    </section>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-4 pb-20">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="h-7 w-16 border border-muted rounded-full bg-muted skeleton-stagger-1" />
        <div className="h-7 w-20 border border-muted rounded-full bg-muted skeleton-stagger-2" />
        <div className="h-7 w-14 border border-muted rounded-full bg-muted skeleton-stagger-3" />
        <div className="h-7 w-18 border border-muted rounded-full bg-muted skeleton-stagger-1" />
      </div>
      <SkeletonGroup />
    </div>
  );
}
