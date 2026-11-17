"use client";

import { useEffect, useRef, useState } from "react";

/** Sticky category pills that follow the reader: the section on screen is highlighted as they scroll. */
export default function CategoryTabs({ tabs, label }: { tabs: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => e !== null);
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;
    // A section counts as current once its top passes just under the sticky header and tabs.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-130px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tabs]);

  // Keep the highlighted pill in view inside the sideways-scrolling row.
  useEffect(() => {
    const root = nav.current;
    const tab = root?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(active)}"]`);
    if (root && tab) root.scrollTo({ left: tab.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  return (
    <nav ref={nav} aria-label={label} className="no-scrollbar sticky top-[61px] z-20 -mx-4 flex gap-2 overflow-x-auto bg-paper/95 px-4 py-3 backdrop-blur">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            data-tab={t.id}
            aria-current={on ? "true" : undefined}
            onClick={() => setActive(t.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-card ring-1 transition active:scale-95 ${on ? "bg-brand-blue text-white ring-brand-blue" : "bg-white text-brand-blue ring-slate-200"}`}
          >
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
