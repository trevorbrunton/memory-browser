import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface MaxWidthWrapperProps {
  className?: string
  children: ReactNode
}

export const MaxWidthWrapper = ({
  className,
  children,
}: MaxWidthWrapperProps) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-screen-2xl bg-muted/40",
        className
      )}
    >
      {children}
    </div>
  );
}
