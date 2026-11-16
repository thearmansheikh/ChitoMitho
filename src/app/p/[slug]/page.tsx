import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getMenu, getPlaceBySlug } from "@/lib/data";
import { pick } from "@/lib/names";
import Menu from "@/components/shop/Menu";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const place = await getPlaceBySlug(params.slug);
  return place ? { title: `${place.name} | Chitto Mitho`, description: place.description ?? undefined } : {};
}

export default async function PlacePage({ params }: { params: { slug: string } }) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) notFound();
  const locale = await getLocale();
  const { categories, items } = await getMenu([place.id]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-blue">{pick(place.name, place.name_ne, locale)}</h1>
        {place.description && <p className="text-slate-600">{place.description}</p>}
      </div>
      <Menu place={place} categories={categories} items={items} />
    </div>
  );
}
