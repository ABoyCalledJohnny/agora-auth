import { cn } from "@/src/lib/utils.ts";

const variants = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

type AlertProps = React.ComponentProps<"div"> & {
  variant?: keyof typeof variants;
};

export function Alert({ children, variant = "error", className, ...rest }: AlertProps) {
  return (
    <div role="alert" className={cn("rounded-md border px-3 py-2 text-sm", variants[variant], className)} {...rest}>
      {children}
    </div>
  );
}
