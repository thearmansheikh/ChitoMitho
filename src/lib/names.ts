/** Show the Nepali name when the UI is in Nepali and one exists; otherwise English. */
export function pick(en: string, ne: string | null | undefined, locale: string): string {
  return locale === "ne" && ne ? ne : en;
}
