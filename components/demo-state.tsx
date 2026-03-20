import { TilList } from "./til-list";
import { DEMO_ITEMS, DEMO_TAGS } from "./data/demo";

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="148"
    height="148"
    viewBox="0 0 148 148"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="148" height="148" rx="36" fill="#1a1917" />
    <g transform="translate(74,74)">
      <line
        x1="0"
        y1="-42"
        x2="0"
        y2="42"
        stroke="white"
        stroke-width="6"
        stroke-linecap="round"
      />
      <line
        x1="-36"
        y1="-21"
        x2="36"
        y2="21"
        stroke="white"
        stroke-width="6"
        stroke-linecap="round"
      />
      <line
        x1="36"
        y1="-21"
        x2="-36"
        y2="21"
        stroke="white"
        stroke-width="6"
        stroke-linecap="round"
      />
      <circle cx="0" cy="0" r="9" fill="#1a1917" />
      <circle cx="0" cy="0" r="5" fill="white" />
    </g>
  </svg>
);

export function DemoState() {
  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden py-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div
        className="pointer-events-none select-none max-h-80"
        aria-hidden="true"
      >
        <TilList
          tils={DEMO_ITEMS}
          totalCount={DEMO_ITEMS.length}
          allTags={DEMO_TAGS}
        />
      </div>

      <div className="absolute flex-1 inset-0 -top-16 m-auto flex flex-col items-center justify-center bg-linear-to-t from-background via-background/95 to-background/60">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full">
            <Logo aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-4xl tracking-tight text-foreground text-pretty font-(family-name:--font-instrument-serif)">
              Your personal TIL log, organized by AI.
            </h1>
            <p className="text-muted-foreground text-sm">
              Save links from your browser, phone, or ask any AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
