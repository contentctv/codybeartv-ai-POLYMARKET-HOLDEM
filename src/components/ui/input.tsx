import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-felt px-3 text-sm text-cream placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
