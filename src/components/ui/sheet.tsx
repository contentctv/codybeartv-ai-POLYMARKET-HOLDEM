import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Sheet(props: ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

function SheetTrigger(props: ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: ComponentProps<typeof Dialog.Content> & { side?: "right" | "left" }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-felt/70" />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex h-full w-[min(100%,20rem)] flex-col gap-4 border-border bg-felt-2 p-6 text-cream shadow-xl",
          side === "right" ? "inset-y-0 right-0 border-l" : "inset-y-0 left-0 border-r",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close className="absolute right-4 top-4 rounded-md p-2 hover:bg-felt" aria-label="Close">
          <X className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function SheetTitle(props: ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className="font-display text-2xl" {...props} />;
}

export { Sheet, SheetTrigger, SheetContent, SheetTitle };
