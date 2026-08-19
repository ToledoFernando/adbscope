import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide whitespace-nowrap uppercase transition-colors focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-hairline bg-panel-raised text-ink-muted",
        destructive:
          "border-state-fault/40 bg-transparent text-state-fault focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline: "border-hairline text-ink-muted [a&]:hover:bg-panel-raised",
        ghost: "border-transparent [a&]:hover:bg-panel-raised",
        link: "border-transparent text-primary underline-offset-4 normal-case [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
