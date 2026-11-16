import type { ReactNode } from "react";

export const inputCls =
  "w-full min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";
export const btnPrimary =
  "min-h-[44px] rounded-lg bg-brand-blue px-4 font-semibold text-white disabled:opacity-50";
export const btnGhost =
  "min-h-[44px] rounded-lg border border-slate-300 px-3 font-semibold text-ink disabled:opacity-40";
export const btnDanger =
  "min-h-[44px] rounded-lg border border-brand-red px-3 font-semibold text-brand-red";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function Notice({ error, ok }: { error?: string | null; ok?: string | null }) {
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-brand-red">{error}</p>;
  if (ok) return <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{ok}</p>;
  return null;
}
