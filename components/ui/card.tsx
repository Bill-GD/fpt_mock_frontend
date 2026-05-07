import * as React from "react";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  right?: React.ReactNode;
};

export function Card({ className, title, description, right, children, ...props }: CardProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-zinc-200 bg-white shadow-sm",
        "dark:border-zinc-800 dark:bg-zinc-950",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {title || description || right ? (
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-900">
          <div className="grid gap-0.5">
            {title ? (
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </header>
      ) : null}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

