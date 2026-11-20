export function cleanSiteUrl(raw: unknown): string | null;
export function resolveSiteUrl(env?: Record<string, string | undefined>): string;
export function redirectRules(env?: Record<string, string | undefined>): { source: string; has: { type: "host"; value: string }[]; destination: string; permanent: boolean }[];
