import { cn } from "@/src/lib/utils.ts";

type InputProps = React.ComponentProps<"input">;

export function Input({ className, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        "rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 transition-colors placeholder:text-neutral-400",
        "hover:border-neutral-300",
        "focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-500 aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-500",
        className,
      )}
      {...rest}
    />
  );
}
