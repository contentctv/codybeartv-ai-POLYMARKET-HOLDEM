import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        ember: "border-ember/40 bg-ember/15 text-ember",
        teal: "border-teal/40 bg-teal/15 text-teal",
        cream: "border-cream/30 bg-cream/10 text-cream",
        muted: "border-border bg-felt text-muted",
      },
    },
    defaultVariants: { variant: "cream" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
