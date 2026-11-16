import type { SupabaseClient } from "@supabase/supabase-js";

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Upload an image to the public "media" bucket and return its public URL. */
export async function uploadImage(sb: SupabaseClient, file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Swap sort_order of two rows in a table. */
export async function swapOrder(
  sb: SupabaseClient,
  table: string,
  a: { id: string; sort_order: number },
  b: { id: string; sort_order: number },
) {
  const r1 = await sb.from(table).update({ sort_order: b.sort_order }).eq("id", a.id);
  const r2 = await sb.from(table).update({ sort_order: a.sort_order }).eq("id", b.id);
  return r1.error || r2.error || null;
}
