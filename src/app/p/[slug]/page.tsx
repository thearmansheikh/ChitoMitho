import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getMenu, getPlaceBySlug, getSettings } from "@/lib/data";
import { pick } from "@/lib/names";
import Menu from "@/components/shop/Menu";
import ComingSoon from "@/components/shop/ComingSoon";
import AgeGate from "@/components/shop/AgeGate";
import PlaceInfo from "@/components/shop/PlaceInfo";
import PageHeader, { type Tone } from "@/components/ui/PageHeader";
import ServiceIcon, { type ServiceIconName } from "@/components/ui/ServiceIcon";
import type { PlaceType } from "@/types/db";
import { pageMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

const LOOK: Record<PlaceType, { icon: ServiceIconName; tone: Tone; href: string; navKey: "food" | "grocery" | "liquor" | "gifts" }> = {
  food: { icon: "food", tone: "red", href: "/food", navKey: "food" },
  grocery: { icon: "grocery", tone: "green", href: "/groceries", navKey: "grocery" },
  liquor: { icon: "liquor", tone: "amber", href: "/liquor", navKey: "liquor" },
  gifts: { icon: "gifts", tone: "pink", href: "/gifts", navKey: "gifts" },
};

const SENTENCE = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : s.trim() + ".");

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const place = await getPlaceBySlug(params.slug);
  if (!place) return {};
  const { items } = await getMenu([place.id]);
  const about = place.description ? ` ${SENTENCE(place.description)}` : "";
  return pageMeta({
    title: `Order from ${place.name} — delivered in Dharan`,
    description: `Order from ${place.name} in Dharan.${about} Delivered by Chitto Mitho. Order on WhatsApp.`.slice(0, 200),
    path: `/p/${place.slug}`,
    image: place.cover_url ?? place.logo_url,
    // A page with no menu yet says little, so search engines are asked to leave it out until it has one.
    noindex: items.length === 0,
  });
}

export default async function PlacePage({ params }: { params: { slug: string } }) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) notFound();
  const locale = await getLocale();
  const n = await getTranslations("nav");
  const l = await getTranslations("liquor");
  const [{ categories, items }, settings] = await Promise.all([getMenu([place.id]), getSettings()]);
  const look = LOOK[place.type];
  const name = pick(place.name, place.name_ne, locale);

  const abs = (u: string | null) => (u ? (u.startsWith("http") ? u : `${SITE_URL}${u}`) : undefined);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": place.type === "food" ? "FoodEstablishment" : "Store",
    "@id": `${SITE_URL}/p/${place.slug}#place`,
    name: place.name,
    url: `${SITE_URL}/p/${place.slug}`,
    ...(place.description ? { description: place.description } : {}),
    ...(abs(place.cover_url ?? place.logo_url) ? { image: abs(place.cover_url ?? place.logo_url) } : {}),
    ...(items.length > 0 ? { hasMenu: `${SITE_URL}/p/${place.slug}` } : {}),
    address: { "@type": "PostalAddress", ...(place.address ? { streetAddress: place.address } : {}), addressLocality: "Dharan", addressCountry: "NP" },
    areaServed: ["Dharan", "Itahari", "Biratnagar"].map((c) => ({ "@type": "City", name: c })),
    ...(place.maps_url && /^https?:/i.test(place.maps_url) ? { hasMap: place.maps_url } : {}),
    parentOrganization: { "@id": `${SITE_URL}/#business` },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: look.navKey === "food" ? "Food" : look.navKey === "grocery" ? "Groceries" : look.navKey === "liquor" ? "Liquor" : "Gifts", item: `${SITE_URL}${look.href}` },
      { "@type": "ListItem", position: 3, name: place.name, item: `${SITE_URL}/p/${place.slug}` },
    ],
  };

  return (
    <div className="space-y-5">
      {/* "<" is escaped so no text can close the script tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]).replace(/</g, "\\u003c") }} />
      <nav aria-label={n("breadcrumb")}>
        <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-slate-500">
          <li><Link href="/" className="inline-flex min-h-[44px] items-center font-semibold text-brand-blue hover:underline">{n("home")}</Link></li>
          <li aria-hidden>›</li>
          <li><Link href={look.href} className="inline-flex min-h-[44px] items-center font-semibold text-brand-blue hover:underline">{n(look.navKey)}</Link></li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="font-semibold text-ink">{name}</li>
        </ol>
      </nav>

      <PageHeader
        icon={<ServiceIcon name={look.icon} className="h-9 w-9" />}
        tone={look.tone}
        title={name}
        subtitle={place.description}
        image={place.cover_url}
      />

      <PlaceInfo
        name={name}
        address={place.address}
        mapsUrl={place.maps_url}
        opensAt={place.opens_at}
        closesAt={place.closes_at}
        shopOpen={settings.open_time}
        shopClose={settings.close_time}
        paused={settings.orders_paused}
      />

      {place.type === "liquor" ? (
        <>
          <p className="rounded-xl bg-amber-50 p-3 text-center font-bold text-amber-900 ring-1 ring-amber-200">{l("ageNote")}</p>
          <AgeGate text={settings.liquor_age_text}>{items.length > 0 ? <Menu place={place} categories={categories} items={items} /> : <ComingSoon place={place} number={settings.whatsapp_number} />}</AgeGate>
        </>
      ) : (
        items.length > 0 ? <Menu place={place} categories={categories} items={items} /> : <ComingSoon place={place} number={settings.whatsapp_number} />
      )}
    </div>
  );
}
