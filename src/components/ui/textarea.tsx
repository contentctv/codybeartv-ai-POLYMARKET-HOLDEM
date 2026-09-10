import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-border bg-felt px-3 py-2 text-sm text-cream placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
