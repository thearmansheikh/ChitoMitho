/** Longest side, in pixels, of an uploaded logo or photo. Big enough for a retina phone, small enough to load fast. */
export const MAX_IMAGE_EDGE = 800;
/** Largest file we will even try to read (before it is shrunk). */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** The size an image should be shrunk to: its longest side is at most `max`, the shape is kept, small images are never enlarged. */
export function fitWithin(width: number, height: number, max = MAX_IMAGE_EDGE): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** The letter shown when a place has no logo: its first letter or digit, upper case. Empty names give "?". */
export function firstLetter(name: string | null | undefined): string {
  const m = (name ?? "").trim().match(/[\p{L}\p{N}]/u);
  return m ? m[0].toLocaleUpperCase() : "?";
}

/** Plain-English reason a picked file cannot be used, or null when it is fine. */
export function imageProblem(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith("image/")) return "Please choose a picture (JPG, PNG or WebP).";
  if (file.size > MAX_UPLOAD_BYTES) return "That picture is too large. Please choose one under 15 MB.";
  return null;
}

/** Shrinks a picture in the browser and saves it as WebP. Returns the original if the browser cannot do it. */
export async function shrinkToWebp(file: File, max = MAX_IMAGE_EDGE, quality = 0.85): Promise<{ blob: Blob; ext: string }> {
  const original = { blob: file as Blob, ext: file.name.split(".").pop()?.toLowerCase() || "jpg" };
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.type !== "image/webp") return original;
    return { blob, ext: "webp" };
  } catch { return original; }
}
