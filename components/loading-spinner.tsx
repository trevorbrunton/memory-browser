import { cva, VariantProps } from "class-variance-authority"

const spinnerVariants = cva(
  "border-4 rounded-full border-brand-200 border-t-brand-700 animate-spin duration-700",
  {
    variants: {
      size: {
        sm: "size-4 border-2",
        md: "size-6 border-4",
        lg: "size-8 border-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
  
)

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
  message?: string
}

export const LoadingSpinner = ({ size, className, message = "Loading..." }: LoadingSpinnerProps) => {
  if (typeof message !== "string") {
    console.error("Invalid prop 'message': must be a string.");
    message = "Loading...";
  }
  return (
    <div className="flex flex-row justify-center items-center">
      <div className={spinnerVariants({ size, className })} />
      <p className="ml-2 text-brand-700 font-medium">{message}</p>
    </div>
  )
}
