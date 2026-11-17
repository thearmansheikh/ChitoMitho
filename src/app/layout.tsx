import type { Metadata, Viewport } from "next";
import { Hind, Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomBar from "@/components/BottomBar";
import { BasketProvider } from "@/context/BasketContext";
import { getSettings } from "@/lib/data";
import { SITE } from "@/lib/config";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Friendly rounded type for English, with Hind covering Devanagari so Nepali sits in the same design.
// The browser only downloads Hind when a page actually shows Nepali text.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});
const hind = Hind({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-hind",
  preload: false,
});

const DESCRIPTION =
  "Order food, groceries, liquor, gifts & flowers, parcels and anything from anywhere. Delivery in Dharan, Itahari and Biratnagar, Nepal. Open 10am – 10pm.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Delivery in Dharan | Chitto Mitho", template: "%s | Chitto Mitho" },
  description: DESCRIPTION,
  applicationName: "Chitto Mitho",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", siteName: "Chitto Mitho", title: "Chitto Mitho – Order anything, from anywhere",
    description: DESCRIPTION, url: SITE_URL, locale: "en_NP",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Chitto Mitho – Your everyday delivery partner" }],
  },
  twitter: {
    card: "summary_large_image", title: "Chitto Mitho – Order anything, from anywhere",
    description: DESCRIPTION, images: ["/og.png"],
  },
  appleWebApp: { capable: true, title: "Chitto Mitho", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#2E5A9C", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const a11y = await getTranslations("a11y");
  const s = await getSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: "Chitto Mitho",
    description: DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}/og.png`,
    logo: `${SITE_URL}/icons/icon-512.png`,
    telephone: s.phone_numbers.map((p) => `+977${p}`),
    priceRange: "Rs.",
    address: { "@type": "PostalAddress", addressLocality: "Dharan", addressCountry: "NP" },
    areaServed: ["Dharan", "Itahari", "Biratnagar"].map((n) => ({ "@type": "City", name: n })),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: s.open_time.slice(0, 5),
      closes: s.close_time.slice(0, 5),
    },
    sameAs: [`https://www.tiktok.com/@${SITE.tiktok}`, `https://www.instagram.com/${SITE.instagram}`],
  };

  return (
    <html lang={locale} className={`${poppins.variable} ${hind.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          // "<" is escaped so no field value can close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-3 focus:font-bold focus:text-white">
          {a11y("skip")}
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BasketProvider>
            <Header />
            <main id="main" className="mx-auto max-w-3xl px-4 py-6">{children}</main>
            <Footer />
            <BottomBar />
          </BasketProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
