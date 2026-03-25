"use client";

import { Popover } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

function HoverCard({ ...props }: Popover.Root.Props) {
  return <Popover.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({
  delay = 500,
  closeDelay = 300,
  ...props
}: Popover.Trigger.Props) {
  return (
    <Popover.Trigger
      data-slot="hover-card-trigger"
      openOnHover
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    />
  );
}

function HoverCardContent({
  className,
  side = "top",
  sideOffset = 8,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: Popover.Popup.Props &
  Pick<
    Popover.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <Popover.Portal>
      <Popover.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <Popover.Popup
          data-slot="hover-card-content"
          className={cn(
            "w-80 origin-(--transform-origin) rounded-xl border bg-popover p-0 text-popover-foreground shadow-lg overflow-hidden",
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            className,
          )}
          {...props}
        >
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
