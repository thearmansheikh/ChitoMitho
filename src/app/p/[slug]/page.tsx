import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getMenu, getPlaceBySlug } from "@/lib/data";
import { pick } from "@/lib/names";
import Menu from "@/components/shop/Menu";
import PageHeader, { type Tone } from "@/components/ui/PageHeader";
import type { PlaceType } from "@/types/db";

const LOOK: Record<PlaceType, { icon: string; tone: Tone }> = {
  food: { icon: "🍽️", tone: "red" },
  grocery: { icon: "🛒", tone: "green" },
  liquor: { icon: "🍺", tone: "amber" },
  gifts: { icon: "💐", tone: "pink" },
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) return {};
  return {
    title: `${place.name} – menu & delivery in Dharan`,
    description: `Order from ${place.name} in Dharan${place.description ? `: ${place.description}` : ""}. Delivered by Chitto Mitho. Order on WhatsApp.`,
    alternates: { canonical: `/p/${place.slug}` },
  };
}

export default async function PlacePage({ params }: { params: { slug: string } }) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) notFound();
  const locale = await getLocale();
  const { categories, items } = await getMenu([place.id]);
  const look = LOOK[place.type];
  return (
    <div className="space-y-5">
      <PageHeader icon={look.icon} tone={look.tone} title={pick(place.name, place.name_ne, locale)} subtitle={place.description} />
      <Menu place={place} categories={categories} items={items} />
    </div>
  );
}
