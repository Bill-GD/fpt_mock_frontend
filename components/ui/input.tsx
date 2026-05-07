import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ className, label, hint, error, id, ...props }: InputProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;

  return (
    <label className="grid gap-1.5 text-sm">
      {label ? <span className="font-medium text-zinc-900 dark:text-zinc-100">{label}</span> : null}
      <input
        id={inputId}
        className={[
          "h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition",
          "border-zinc-200 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
          "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100/10",
          error ? "border-red-300 focus:border-red-400 focus:ring-red-500/10 dark:border-red-900/60" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}

