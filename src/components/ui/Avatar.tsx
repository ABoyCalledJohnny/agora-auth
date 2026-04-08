import Image from "next/image";

import { cn } from "@/src/lib/utils.ts";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

type AvatarProps = Omit<React.ComponentProps<typeof Image>, "alt" | "width" | "height"> & {
  src?: string | null;
  alt: string;
  size?: keyof typeof sizes;
  fallback?: string;
};

export function Avatar({ src, alt, size = "md", fallback, className, ...rest }: AvatarProps) {
  const initials = fallback ?? alt.charAt(0).toUpperCase();

  if (!src) {
    return (
      <span
        aria-label={alt}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-medium text-neutral-600",
          sizes[size],
          className,
        )}
      >
        {initials}
      </span>
    );
  }

  const dimension = size === "sm" ? 32 : size === "lg" ? 48 : 40;

  return (
    <Image
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn("inline-block shrink-0 rounded-full object-cover", sizes[size], className)}
      {...rest}
    />
  );
}
