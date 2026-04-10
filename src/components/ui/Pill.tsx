import { cn } from "@/src/lib/utils.ts";

// ---------------------------------------------------------------------------
// Status Variants
// ---------------------------------------------------------------------------

const statusVariants = {
  active: "border-green-200 bg-green-50 text-green-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  suspended: "border-red-200 bg-red-50 text-red-700",
};

// ---------------------------------------------------------------------------
// Role Variants (with inline SVG icons)
// ---------------------------------------------------------------------------

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="size-3.5"
    viewBox="0 0 640 640"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M256 312C322.3 312 376 258.3 376 192C376 125.7 322.3 72 256 72C189.7 72 136 125.7 136 192C136 258.3 189.7 312 256 312zM226.3 368C127.8 368 48 447.8 48 546.3C48 562.7 61.3 576 77.7 576L329.2 576C293 533.4 272 478.5 272 420.4L272 389.3C272 382 273 374.8 274.9 368L226.3 368zM477.3 552.5L464 558.8L464 370.7L560 402.7L560 422.3C560 478.1 527.8 528.8 477.3 552.6zM453.9 323.5L341.9 360.8C328.8 365.2 320 377.4 320 391.2L320 422.3C320 496.7 363 564.4 430.2 596L448.7 604.7C453.5 606.9 458.7 608.1 463.9 608.1C469.1 608.1 474.4 606.9 479.1 604.7L497.6 596C565 564.3 608 496.6 608 422.2L608 391.1C608 377.3 599.2 365.1 586.1 360.7L474.1 323.4C467.5 321.2 460.4 321.2 453.9 323.4z" />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="size-3.5"
    viewBox="0 0 640 640"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z" />
  </svg>
);

const roleVariants = {
  admin: {
    classes: "border-purple-200 bg-purple-50 text-purple-700",
    icon: ShieldIcon,
  },
  user: {
    classes: "border-blue-200 bg-blue-50 text-blue-600",
    icon: UserIcon,
  },
};

// ---------------------------------------------------------------------------
// Pill
// ---------------------------------------------------------------------------

type StatusPillProps = React.ComponentProps<"span"> & {
  variant: keyof typeof statusVariants;
};

export function StatusPill({ variant, children, className, ...rest }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2 py-1 text-xs font-medium select-none",
        statusVariants[variant],
        className,
      )}
      {...rest}
    >
      {children ?? variant.charAt(0).toUpperCase() + variant.slice(1)}
    </span>
  );
}

type RolePillProps = React.ComponentProps<"span"> & {
  variant: keyof typeof roleVariants;
};

export function RolePill({ variant, children, className, ...rest }: RolePillProps) {
  const { classes, icon: Icon } = roleVariants[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-full border px-2 py-1 text-xs font-medium select-none",
        classes,
        className,
      )}
      {...rest}
    >
      <Icon />
      {children ?? variant.charAt(0).toUpperCase() + variant.slice(1)}
    </span>
  );
}
