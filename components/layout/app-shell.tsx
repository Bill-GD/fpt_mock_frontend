import Link from "next/link";
import * as React from "react";

export type NavItem = {
  href: string;
  label: string;
  badge?: string;
};

export function AppShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <aside className="hidden w-72 shrink-0 border-r border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 lg:block">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
            SQ
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
            {subtitle ? <div className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div> : null}
          </div>
        </div>
        <nav className="px-3 py-4">
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/70 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/60">
          <div className="container-app flex h-16 items-center justify-between">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
              {subtitle ? <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div> : null}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Trang chủ
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </header>

        <main className="container-app w-full flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}

