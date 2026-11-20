import createNextIntlPlugin from "next-intl/plugin";
import { redirectRules } from "./src/lib/siteUrl.mjs";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a second build (for example a domain rehearsal) use its own folder: NEXT_DIST_DIR=.next-rehearsal
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  // Once a custom domain is set, the free *.vercel.app address and the www/non-www twin redirect to it.
  async redirects() {
    return redirectRules();
  },
};

export default withNextIntl(nextConfig);
