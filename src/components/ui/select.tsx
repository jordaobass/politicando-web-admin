import * as React from "react";

import { cn } from "@/lib/utils";

/** Select nativo estilizado — suficiente e acessível para filtros do admin. */
export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
