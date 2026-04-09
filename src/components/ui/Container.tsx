import { cn } from "@/src/lib/utils.ts";

type ContainerProps<T extends React.ElementType = "div"> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<T>, "as" | "children" | "className">;

export function Container<T extends React.ElementType = "div">({
  as,
  children,
  className,
  ...rest
}: ContainerProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag className={cn("mx-auto max-w-7xl px-4 sm:px-6", className)} {...rest}>
      {children}
    </Tag>
  );
}
