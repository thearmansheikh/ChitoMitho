/** Liquor is only sold and shown when the team switches it on in Admin > Settings. Off by default. */
export function liquorEnabledOf(settings: { liquor_enabled?: boolean | null } | null | undefined): boolean {
  return settings?.liquor_enabled === true;
}

/** The browser key that remembers "I am 18 or older" on this device. */
export const AGE_KEY = "cm-age-ok";
