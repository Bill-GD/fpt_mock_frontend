import * as React from "react";

type Variant = "default" | "success" | "warning" | "danger";

const variantClass: Record<Variant, string> = {
  default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variantClass[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

