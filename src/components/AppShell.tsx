"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/actions/signout.action";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function AppShell({
  navItems,
  userName,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Sidebar — muncul di layar >= md, tersembunyi di mobile */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:flex md:flex-col">
        <div className="mb-6 px-2">
          <h2 className="text-lg font-semibold text-slate-900">Monitoring Gizi</h2>
          <p className="text-xs text-slate-500">Studi Nugget Zinc — 28 hari</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-brand/10 text-brand-dark"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 pt-3">
          <p className="px-2 text-sm font-medium text-slate-900">{userName}</p>
          <p className="px-2 text-xs text-slate-500">{roleLabel}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div>
          <p className="text-sm font-semibold text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="text-sm font-medium text-slate-500">
            Keluar
          </button>
        </form>
      </header>

      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">{children}</div>
      </main>

      {/* Bottom nav — muncul di mobile, tersembunyi di layar >= md */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium",
                active ? "text-brand-dark" : "text-slate-500"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
