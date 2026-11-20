import { resolveSiteUrl } from "./siteUrl.mjs";

/** The website's public address, no trailing slash. Set NEXT_PUBLIC_SITE_URL to your own domain; see README "Connect your domain". */
export const SITE_URL = resolveSiteUrl();
