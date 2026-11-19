/**
 * Turns pasted menu text into rows ready to import. Pure functions, so they can be tested on their own.
 *
 * Understands three shapes of input:
 *  1. A table copied from Excel or Google Sheets (tab separated), or a CSV file, with or without a header row.
 *  2. Pipe or semicolon separated lines.
 *  3. A plain typed menu: a heading line (no price) starts a category, and each item line ends with its price.
 */

export interface ParsedRow {
  /** 1-based line number in the pasted text, for pointing at mistakes. */
  line: number;
  category: string;
  name: string;
  nameNe: string;
  description: string;
  price: number | null;
  /** Set when the row cannot be imported. */
  error?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  /** What kind of text was recognised, shown to the person so they can sanity-check it. */
  format: "table" | "plain" | "empty";
  delimiter: "tab" | "pipe" | "semicolon" | "comma" | null;
  hadHeader: boolean;
}

export const MAX_ROWS = 500;

const DEVANAGARI = "०१२३४५६७८९";
const toAsciiDigits = (s: string) => s.replace(/[०-९]/g, (d) => String(DEVANAGARI.indexOf(d)));

/** A cell that is only a price: "250", "1,250", "Rs. 250", "रु 250", "250/-", "99.50". */
const PRICE_CELL = /^(?:rs\.?|npr|रु\.?|₹)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:\/-|only)?$/i;
/** A line that ends with a price, with the name in front. */
const PRICE_AT_END = /^(.*?)[\s.:–—-]*(?:rs\.?|npr|रु\.?|₹)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:\/-|only)?$/i;

export function parsePrice(raw: string): number | null {
  const m = toAsciiDigits(raw.trim()).match(PRICE_CELL);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Splits one CSV or delimited line, honouring "quoted, fields" and doubled quotes. */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"' && cur === "") quoted = true;
    else if (c === delim) { out.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

const DELIMS = { tab: "\t", pipe: "|", semicolon: ";", comma: "," } as const;

/** Picks the separator that most lines agree on. Commas are only trusted when lines have a steady column count. */
function detectDelimiter(lines: string[]): keyof typeof DELIMS | null {
  const sample = lines.filter((l) => l.trim());
  if (sample.length === 0) return null;
  for (const key of ["tab", "pipe", "semicolon", "comma"] as const) {
    const d = DELIMS[key];
    const counts = sample.map((l) => splitLine(l, d).length);
    const withDelim = counts.filter((c) => c >= 2).length;
    if (withDelim / sample.length < 0.6) continue;
    if (key === "comma") {
      // "Momo, chicken 250" is a typed line, not a CSV row: only accept commas when the columns line up.
      const mode = counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)];
      if (counts.filter((c) => c === mode).length / counts.length < 0.7) continue;
    }
    return key;
  }
  return null;
}

// Checked in this order, so "Nepali name" is the Nepali column and is not mistaken for "name".
const HEADER_WORDS = {
  nameNe: ["nepali", "name_ne", "name ne", "ne", "नेपाली"],
  category: ["category", "type", "section", "group", "वर्ग"],
  price: ["price", "rate", "cost", "amount", "npr", "rs", "मूल्य", "दर"],
  name: ["name", "item", "dish", "product", "नाम", "सामान"],
  description: ["description", "desc", "details", "about"],
} as const;

type Field = keyof typeof HEADER_WORDS;

/** "Price (Rs)" and "Name english" count as price and name; "Nepali name" counts as the Nepali column. */
function matchesHeader(w: string, f: Field): boolean {
  if (f === "nameNe") return /nepali|name ?_?ne\b|^ne$|नेपाली/.test(w);
  return (HEADER_WORDS[f] as readonly string[]).some((x) => w === x || w.startsWith(x + " "));
}

function headerMap(cells: string[]): Partial<Record<Field, number>> | null {
  // A header row has a name-like word and no price in the cell that would hold the price.
  const map: Partial<Record<Field, number>> = {};
  cells.forEach((c, i) => {
    const w = c.toLowerCase().replace(/[^a-z_ऀ-ॿ ]/g, " ").replace(/\s+/g, " ").trim();
    for (const f of Object.keys(HEADER_WORDS) as Field[]) {
      if (map[f] === undefined && matchesHeader(w, f)) { map[f] = i; break; }
    }
  });
  const looksLikeHeader = map.name !== undefined && map.price !== undefined && cells.every((c) => parsePrice(c) === null);
  return looksLikeHeader ? map : null;
}

function tableRows(lines: { text: string; n: number }[], delim: string): { rows: ParsedRow[]; hadHeader: boolean } {
  const rows: ParsedRow[] = [];
  let header: Partial<Record<Field, number>> | null = null;
  let hadHeader = false;

  lines.forEach(({ text, n }, idx) => {
    const cells = splitLine(text, delim);
    if (idx === 0) {
      header = headerMap(cells);
      if (header) { hadHeader = true; return; }
    }
    let category = "", name = "", nameNe = "", description = "", priceCell = "";
    if (header) {
      const h = header as Partial<Record<Field, number>>;
      const at = (f: Field) => (h[f] !== undefined ? cells[h[f]!] ?? "" : "");
      category = at("category"); name = at("name"); nameNe = at("nameNe"); description = at("description"); priceCell = at("price");
    } else {
      // No header: the price is the first cell that is only a price. What comes before is name (and category), after is Nepali name and description.
      const p = cells.findIndex((c, i) => i > 0 && parsePrice(c) !== null);
      if (p === -1) {
        name = cells[cells.length >= 2 ? 1 : 0] ?? "";
        category = cells.length >= 3 ? cells[0] : "";
      } else {
        const before = cells.slice(0, p);
        name = before[before.length - 1] ?? "";
        category = before.length >= 2 ? before[0] : "";
        nameNe = cells[p + 1] ?? "";
        description = cells[p + 2] ?? "";
        priceCell = cells[p];
      }
    }
    const price = parsePrice(priceCell);
    const row: ParsedRow = { line: n, category: category.trim(), name: name.trim(), nameNe: nameNe.trim(), description: description.trim(), price };
    if (!row.name) row.error = "Missing item name";
    else if (price === null) row.error = "No price found";
    rows.push(row);
  });
  return { rows, hadHeader };
}

/** Typed menus: a line without a price starts a category; a line ending in a price is an item. */
function plainRows(lines: { text: string; n: number }[]): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let category = "";
  for (const { text, n } of lines) {
    // Remove bullets and list numbers such as "•", "-", "1." or "2)".
    const cleaned = toAsciiDigits(text).replace(/^\s*(?:[•·▪●\-*]|\d{1,2}[.)])\s+/, "").trim();
    if (!cleaned) continue;
    const m = cleaned.match(PRICE_AT_END);
    const price = m ? Number(m[2].replace(/,/g, "")) : null;
    const name = m ? m[1].replace(/[\s.:–—-]+$/, "").trim() : "";
    if (m && name) {
      rows.push({ line: n, category, name, nameNe: "", description: "", price });
    } else if (m && !name) {
      rows.push({ line: n, category, name: "", nameNe: "", description: "", price, error: "Missing item name" });
    } else {
      // No price: this is a heading. Drop trailing colons and decoration.
      category = cleaned.replace(/[:\-–—=_*#]+$/g, "").replace(/^[#*=_\-–—]+/, "").trim();
    }
  }
  return rows;
}

export function parseMenu(input: string): ParseResult {
  const lines = input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((text, i) => ({ text, n: i + 1 }))
    .filter((l) => l.text.trim() !== "");
  if (lines.length === 0) return { rows: [], format: "empty", delimiter: null, hadHeader: false };

  const key = detectDelimiter(lines.map((l) => l.text));
  let rows: ParsedRow[];
  let hadHeader = false;
  if (key) {
    const t = tableRows(lines, DELIMS[key]);
    rows = t.rows; hadHeader = t.hadHeader;
  } else {
    rows = plainRows(lines);
  }

  // The same dish twice in one paste would create a duplicate: keep the first and say so.
  const seen = new Set<string>();
  for (const r of rows) {
    if (r.error) continue;
    const k = `${r.category.toLowerCase()}|${r.name.toLowerCase()}`;
    if (seen.has(k)) r.error = "Repeated in the pasted text";
    seen.add(k);
  }
  if (rows.length > MAX_ROWS) rows = rows.slice(0, MAX_ROWS);
  return { rows, format: key ? "table" : "plain", delimiter: key, hadHeader };
}

/* ---------------- matching against what is already in the database ---------------- */

export interface ExistingItem { id: string; name: string; name_ne: string | null; price_npr: number; category_id: string | null }
export interface ExistingCategory { id: string; name: string; sort_order: number }

export type RowAction = "new" | "update" | "same" | "skip";

export interface PlannedRow extends ParsedRow {
  action: RowAction;
  /** Id of the matching existing item for update and same. */
  existingId?: string;
  /** Short reason shown next to the row. */
  note: string;
}

export const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Decide what to do with each parsed row. Nothing is ever deleted. */
export function planImport(rows: ParsedRow[], existing: ExistingItem[], updatePrices: boolean): PlannedRow[] {
  const byName = new Map(existing.map((e) => [norm(e.name), e]));
  return rows.map((r) => {
    if (r.error) return { ...r, action: "skip" as const, note: r.error };
    const hit = byName.get(norm(r.name));
    if (!hit) return { ...r, action: "new" as const, note: "New item" };
    if (Number(hit.price_npr) === r.price) return { ...r, action: "same" as const, existingId: hit.id, note: "Already there, same price" };
    return updatePrices
      ? { ...r, action: "update" as const, existingId: hit.id, note: `Price changes from Rs. ${Number(hit.price_npr)}` }
      : { ...r, action: "skip" as const, existingId: hit.id, note: "Already there (prices not updated)" };
  });
}

/** Categories the import will need to create: names not already on the place, case-insensitive. */
export function newCategoryNames(rows: PlannedRow[], categories: ExistingCategory[]): string[] {
  const have = new Set(categories.map((c) => norm(c.name)));
  const out: string[] = [];
  for (const r of rows) {
    if (r.action !== "new" || !r.category) continue;
    const k = norm(r.category);
    if (!have.has(k)) { have.add(k); out.push(r.category.trim()); }
  }
  return out;
}

/** A blank CSV to fill in and upload. The one sample row is clearly marked so it is not imported by accident. */
export const CSV_TEMPLATE = [
  "Category,Name,Price,Nepali name,Description",
  "Starters,EXAMPLE - delete this row,100,,Optional description",
].join("\r\n") + "\r\n";

export const EXAMPLE_MENU = `Momo
Chicken Momo 250
Veg Momo 200
Buff Momo 230

Drinks
Cold Coffee 180
Lemon Tea 90`;
