import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getMenu, getPlaceBySlug, getSettings } from "@/lib/data";
import { pick } from "@/lib/names";
import Menu from "@/components/shop/Menu";
import PlaceInfo from "@/components/shop/PlaceInfo";
import PageHeader, { type Tone } from "@/components/ui/PageHeader";
import ServiceIcon, { type ServiceIconName } from "@/components/ui/ServiceIcon";
import type { PlaceType } from "@/types/db";

const LOOK: Record<PlaceType, { icon: ServiceIconName; tone: Tone; href: string; navKey: "food" | "grocery" | "liquor" | "gifts" }> = {
  food: { icon: "food", tone: "red", href: "/food", navKey: "food" },
  grocery: { icon: "grocery", tone: "green", href: "/groceries", navKey: "grocery" },
  liquor: { icon: "liquor", tone: "amber", href: "/liquor", navKey: "liquor" },
  gifts: { icon: "gifts", tone: "pink", href: "/gifts", navKey: "gifts" },
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) return {};
  return {
    title: `${place.name} – menu & delivery in Dharan`,
    description: `Order from ${place.name} in Dharan${place.description ? `: ${place.description}` : ""}. Delivered by Chitto Mitho. Order on WhatsApp.`,
    alternates: { canonical: `/p/${place.slug}` },
    ...(place.cover_url ? { openGraph: { images: [{ url: place.cover_url }] } } : {}),
  };
}

export default async function PlacePage({ params }: { params: { slug: string } }) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) notFound();
  const locale = await getLocale();
  const n = await getTranslations("nav");
  const [{ categories, items }, settings] = await Promise.all([getMenu([place.id]), getSettings()]);
  const look = LOOK[place.type];
  const name = pick(place.name, place.name_ne, locale);

  return (
    <div className="space-y-5">
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

      <Menu place={place} categories={categories} items={items} />
    </div>
  );
}
