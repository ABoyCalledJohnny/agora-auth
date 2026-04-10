import { cn } from "@/src/lib/utils.ts";

type CenteredLayoutProps = React.ComponentProps<"div">;

export function CenteredLayout({ children, className, ...rest }: CenteredLayoutProps) {
  return (
    <div className={cn("flex -translate-y-2 items-center justify-center sm:-translate-y-10", className)} {...rest}>
      {children}
    </div>
  );
}
