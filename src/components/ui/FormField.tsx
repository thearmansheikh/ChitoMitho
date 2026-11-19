"use client";

import Req from "./Req";

/**
 * One labelled field: the label (with a * when required), the control, a hint and an error message.
 * A real space separates the parts, so text extracted from the page never runs them together ("areae.g.").
 */
export default function FormField({ label, required = false, help, error, children }: {
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">{label}{required && <Req />}</span>{" "}
      {children}{" "}
      {help && <span className="block text-xs text-slate-500">{help}</span>}{" "}
      {error && <span role="alert" className="block text-sm text-brand-red">{error}</span>}
    </label>
  );
}
