"use client";

import * as React from "react";

export type ToastVariant = "default" | "success" | "warning" | "danger";

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant?: ToastVariant;
  createdAt: number;
  ttlMs?: number;
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, "id" | "createdAt">) => void;
  clear: () => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function variantClass(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200";
    case "danger":
      return "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200";
    default:
      return "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((toast: Omit<ToastItem, "id" | "createdAt">) => {
    const id = `t_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    const createdAt = Date.now();
    const ttlMs = toast.ttlMs ?? 4500;
    const item: ToastItem = { ...toast, id, createdAt, ttlMs };

    setItems((prev) => [item, ...prev].slice(0, 5));

    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, ttlMs);
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  return (
    <ToastContext.Provider value={{ push, clear }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 grid w-[360px] max-w-[calc(100vw-2rem)] gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={[
              "pointer-events-auto rounded-2xl border px-4 py-3 shadow-sm backdrop-blur",
              variantClass(item.variant ?? "default"),
            ].join(" ")}
            role="status"
          >
            <div className="text-sm font-semibold">{item.title}</div>
            {item.message ? <div className="mt-0.5 text-sm opacity-90">{item.message}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

