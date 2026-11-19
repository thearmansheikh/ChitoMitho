import type { SupabaseClient } from "@supabase/supabase-js";
import { imageProblem, shrinkToWebp } from "@/lib/image";

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Shrink a picture to WebP (longest side ~800px) and upload it to the public "media" bucket. Returns its public URL. */
export async function uploadImage(sb: SupabaseClient, file: File, folder: string): Promise<string> {
  const problem = imageProblem(file);
  if (problem) throw new Error(problem);
  const { blob, ext } = await shrinkToWebp(file);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, blob, { contentType: blob.type || file.type, upsert: false, cacheControl: "31536000" });
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
