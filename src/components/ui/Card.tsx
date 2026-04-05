import { cn } from "@/src/lib/utils.ts";

type CardProps = React.ComponentProps<"div">;

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-[0_1px_1px_0_rgba(20,20,20,0.05)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
