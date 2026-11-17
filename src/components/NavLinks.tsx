"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Main menu for wide screens. The current section is highlighted and announced to screen readers. */
export default function NavLinks({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="hidden items-center gap-1 lg:flex">
      {items.map((i) => {
        const active = path === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${active ? "bg-brand-blue text-white" : "text-ink hover:bg-slate-100"}`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
