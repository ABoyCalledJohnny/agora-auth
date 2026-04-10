import { cn } from "@/src/lib/utils.ts";

const variants = {
  primary: "bg-teal-500 text-white hover:bg-teal-600",
  secondary: "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  "danger-outline": "border border-red-200 text-red-600 hover:bg-red-50",
  ghost: "text-neutral-600 hover:bg-neutral-100",
};

const sizes = {
  sm: "px-3 py-1 text-xs",
  md: "px-5 py-2 text-sm",
};

type ButtonVariantOptions = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

export function buttonVariants({ variant = "primary", size = "md", className }: ButtonVariantOptions = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors duration-200 ease-in-out",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  pending?: boolean;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  pending,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), "disabled:pointer-events-none disabled:opacity-50", className)}
      disabled={disabled ?? pending}
      aria-busy={pending ?? undefined}
      {...rest}
    >
      {pending ? (
        <>
          <span className="sr-only">{children}</span>
          <svg
            aria-hidden="true"
            className="size-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </>
      ) : (
        children
      )}
    </button>
  );
}
