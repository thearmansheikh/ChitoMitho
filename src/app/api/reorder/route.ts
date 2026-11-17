import { NextResponse } from "next/server";
import { getItemStatus } from "@/lib/data";

export const dynamic = "force-dynamic";

/** POST { ids: string[] } -> current price and availability of those items (public data only). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 60 || !ids.every((i) => typeof i === "string" && i.length > 0 && i.length <= 64)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    const items = await getItemStatus(ids as string[]);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
