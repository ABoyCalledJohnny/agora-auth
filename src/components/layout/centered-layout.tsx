import { cn } from "@/src/lib/utils.ts";

type CenteredLayoutProps = React.ComponentProps<"div">;

export function CenteredLayout({ children, className, ...rest }: CenteredLayoutProps) {
  return (
    <div className={cn("flex items-center justify-center pb-20", className)} {...rest}>
      {children}
    </div>
  );
}
