import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#163A70] text-white",
        secondary:
          "border-transparent bg-[#EAF2FF] text-[#163A70]",
        success:
          "border-transparent bg-[#E6F7EF] text-[#1F9D66]",
        warning:
          "border-transparent bg-[#FBF1E0] text-[#C9821A]",
        destructive:
          "border-transparent bg-[#FBEAE9] text-[#D0473F]",
        archived:
          "border-transparent bg-[#EDEBFB] text-[#5B3FBF]",
        outline: "text-[#16233F] border border-[#E3E8F0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
