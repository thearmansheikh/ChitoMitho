import type { ItemOptionGroup } from "@/types/db";

const MAX_GROUPS = 6;
const MAX_CHOICES = 20;

const text = (v: unknown, max = 80): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Turns whatever is stored in items.options into clean option groups. Anything malformed is dropped. */
export function cleanOptions(value: unknown): ItemOptionGroup[] {
  if (!Array.isArray(value)) return [];
  const groups: ItemOptionGroup[] = [];
  for (const g of value.slice(0, MAX_GROUPS)) {
    if (!g || typeof g !== "object") continue;
    const r = g as Record<string, unknown>;
    const name = text(r.name);
    const choices = (Array.isArray(r.choices) ? r.choices : [])
      .slice(0, MAX_CHOICES)
      .flatMap((c) => {
        if (!c || typeof c !== "object") return [];
        const cr = c as Record<string, unknown>;
        const cname = text(cr.name);
        const price = Number(cr.price ?? 0);
        if (!cname || !Number.isFinite(price)) return [];
        return [{ name: cname, name_ne: text(cr.name_ne) || null, price: Math.round(price * 100) / 100 }];
      });
    if (!name || choices.length === 0) continue;
    groups.push({ name, name_ne: text(r.name_ne) || null, required: r.required === true, multi: r.multi === true, choices });
  }
  return groups;
}

/** Admin typing: one choice per line, "Large +50", "Extra cheese +30", "Regular". Returns null for a line it cannot read. */
export function parseChoiceLine(line: string): { name: string; price: number } | null {
  const m = line.trim().match(/^(.*?)(?:\s*([+-])\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?))?$/i);
  if (!m) return null;
  const name = m[1].trim();
  if (!name) return null;
  const price = m[3] ? (m[2] === "-" ? -1 : 1) * Number(m[3]) : 0;
  return { name, price };
}

/** The reverse of parseChoiceLine, for showing stored choices in a text box. */
export function choiceLine(c: { name: string; price: number }): string {
  return c.price === 0 ? c.name : `${c.name} ${c.price > 0 ? "+" : "-"}${Math.abs(c.price)}`;
}
