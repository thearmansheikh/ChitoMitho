export type Payment = "cod" | "qr";

export interface Details {
  name: string;
  phone: string;
  areaId: string; // area uuid, "other", or "" when not chosen
  areaOther: string;
  landmark: string;
  payment: Payment;
}

export const EMPTY_DETAILS: Details = {
  name: "",
  phone: "",
  areaId: "",
  areaOther: "",
  landmark: "",
  payment: "cod",
};

/** Nepal mobile: 97 or 98 followed by 8 digits. */
export const PHONE_RE = /^9[78]\d{8}$/;

/** Strip spaces/dashes and a leading country code so "+977 98-12345678" becomes "9812345678". */
export function normalizePhone(s: string): string {
  let d = s.replace(/\D/g, "");
  if (d.startsWith("977") && d.length === 13) d = d.slice(3);
  return d;
}

const KEY = "cm-details-v1";

/** Saved on the customer's own phone only; never sent to our database. */
export function loadDetails(): Details | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return { ...EMPTY_DETAILS, ...(JSON.parse(raw) as Partial<Details>) };
  } catch {
    return null;
  }
}

export function saveDetails(d: Details) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage blocked: the customer just retypes next time */
  }
}
