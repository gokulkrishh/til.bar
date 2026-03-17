import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-[transform,color,background-color,border-color,box-shadow] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-98",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline: "text-foreground",
      },
      size: {
        default: "px-2.5 py-1",
        lg: "px-3 py-1.5 text-sm hit-area-y-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type BadgeProps = VariantProps<typeof badgeVariants> &
  (
    | (React.ComponentProps<"button"> & { onClick: React.MouseEventHandler })
    | (React.ComponentProps<"span"> & { onClick?: never })
  );

function Badge({ className, variant, size, ...props }: BadgeProps) {
  const classes = cn(badgeVariants({ variant, size }), className);

  if (props.onClick) {
    return (
      <button
        type="button"
        data-slot="badge"
        className={cn(classes, "cursor-pointer")}
        {...(props as React.ComponentProps<"button">)}
      />
    );
  }

  return (
    <span
      data-slot="badge"
      className={classes}
      {...(props as React.ComponentProps<"span">)}
    />
  );
}

export { Badge, badgeVariants };
