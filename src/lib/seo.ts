import type { Metadata } from "next";
import { SITE_URL } from "./site";

const BRAND = "Chitto Mitho";
/** The picture shown when a link to the site is shared (WhatsApp, Facebook, Messenger...). */
export const DEFAULT_OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "Chitto Mitho – Your everyday delivery partner" };

export interface PageMetaInput {
  /** The page title without the brand. The layout adds " | Chitto Mitho". Keep it under about 45 characters. */
  title: string;
  /** One or two sentences for search results and shared links, 70 to 160 characters. */
  description: string;
  /** The page's own address, starting with "/". "" is the home page. */
  path: string;
  /** A picture for shared links. Defaults to the site picture. */
  image?: string | null;
  /** Ask search engines to leave this page out. */
  noindex?: boolean;
  /** Use the title exactly as written, with the brand added once here (for the home page, which the layout title template does not reach). */
  absolute?: boolean;
}

/**
 * Everything a page needs for search engines and shared links, built from one source so the browser-tab title,
 * the search-result title and the shared-link title (Open Graph and Twitter) are always the same words.
 */
export function pageMeta({ title, description, path, image, noindex = false, absolute = false }: PageMetaInput): Metadata {
  const full = `${title} | ${BRAND}`;
  const images = image ? [{ url: image }] : [DEFAULT_OG_IMAGE];
  return {
    title: absolute ? { absolute: full } : title,
    description,
    alternates: { canonical: path || "/" },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "website", siteName: BRAND, locale: "en_NP", url: `${SITE_URL}${path}`, title: full, description, images },
    twitter: { card: "summary_large_image", title: full, description, images: images.map((i) => i.url) },
  };
}
