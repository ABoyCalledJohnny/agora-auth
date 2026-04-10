import { cn } from "@/src/lib/utils.ts";

type CardHeadlineProps = React.ComponentProps<"div"> & {
  title: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

export function CardHeadline({ title, icon, iconPosition = "left", className, ...rest }: CardHeadlineProps) {
  return (
    <div className={cn("relative mb-4 flex items-center justify-between gap-2 pb-2", className)} {...rest}>
      {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      <h2 className="flex-1">{title}</h2>
      {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
      <span className="absolute bottom-0 left-0 h-0.5 w-full bg-neutral-200" />
      <span className="absolute bottom-0 left-0 h-0.5 w-10 bg-teal-500" />
    </div>
  );
}
