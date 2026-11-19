/**
 * Hands a WhatsApp link (see buildWhatsAppUrl) to the phone or computer. Call it straight from a tap, before anything is awaited:
 * browsers (iPhone Safari above all) only allow opening another app or tab as a direct result of a tap.
 *
 * - Phones and tablets: go to the link in this tab. That is the reliable way to reach the WhatsApp app.
 * - Computers: a new tab (WhatsApp Web or the desktop app), so the website stays open. If the browser
 *   blocks the tab, go in this tab instead.
 * Not "noopener": that option makes window.open return null even when the tab opened, which would send this tab away too.
 */
export function openWhatsApp(url: string): "new-tab" | "same-tab" {
  logWhatsAppUrl(url);
  if (!isTouchDevice()) {
    const w = window.open(url, "_blank");
    if (w) {
      try { w.opener = null; } catch { /* nothing to do */ }
      return "new-tab";
    }
  }
  window.location.href = url;
  return "same-tab";
}

function isTouchDevice(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ says it is a Mac, so also look for a touch screen.
  return /Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

/** Development only: shows exactly what WhatsApp will be given. */
export function logWhatsAppUrl(url: string): void {
  if (process.env.NODE_ENV === "production") return;
  try {
    const text = new URL(url).searchParams.get("text") ?? "";
    console.log("[whatsapp] opening", url, "\n--- decoded message (" + text.length + " characters) ---\n" + text);
  } catch {
    console.log("[whatsapp] opening", url);
  }
}
