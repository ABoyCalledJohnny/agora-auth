import { cn } from "@/src/lib/utils.ts";

type CenteredLayoutProps = React.ComponentProps<"div">;

export function CenteredLayout({ children, className, ...rest }: CenteredLayoutProps) {
  return (
    <div className={cn("flex items-start justify-center pt-[20dvh]", className)} {...rest}>
      {children}
    </div>
  );
}
