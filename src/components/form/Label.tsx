import { cn } from "@/src/lib/utils.ts";

type LabelProps = React.ComponentProps<"label">;

export function Label({ children, className, ...rest }: LabelProps) {
  return (
    <label className={cn("text-sm font-medium text-neutral-700", className)} {...rest}>
      {children}
    </label>
  );
}
