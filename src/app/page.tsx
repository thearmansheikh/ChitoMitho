import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getFeatured, getMenu, getOffers, getPlaces, getSettings } from "@/lib/data";
import { pick } from "@/lib/names";
import { placeTags } from "@/lib/tags";
import TodaysPicks from "@/components/shop/TodaysPicks";
import SearchBar from "@/components/shop/SearchBar";
import CravingRow from "@/components/shop/CravingRow";
import PlaceCard from "@/components/shop/PlaceCard";
import PartnerStrip from "@/components/shop/PartnerStrip";
import ClosedNotice from "@/components/shop/ClosedNotice";
import ReorderCard from "@/components/shop/ReorderCard";
import OffersStrip from "@/components/shop/OffersStrip";
import HeroScene from "@/components/ui/HeroScene";
import ServiceIcon from "@/components/ui/ServiceIcon";
import SectionTitle from "@/components/ui/SectionTitle";

// Each service gets its own soft colour so people can find it by sight, not only by reading.
const SERVICES = [
  { href: "/food", key: "food", icon: "🍔", badge: "bg-red-100", glow: "group-hover:shadow-red-200" },
  { href: "/groceries", key: "grocery", icon: "🛒", badge: "bg-emerald-100", glow: "group-hover:shadow-emerald-200" },
  { href: "/liquor", key: "liquor", icon: "🍺", badge: "bg-amber-100", glow: "group-hover:shadow-amber-200" },
  { href: "/gifts", key: "gifts", icon: "💐", badge: "bg-rose-100", glow: "group-hover:shadow-rose-200" },
  { href: "/parcel", key: "parcel", icon: "📦", badge: "bg-sky-100", glow: "group-hover:shadow-sky-200" },
  { href: "/anything", key: "anything", icon: "✨", badge: "bg-indigo-100", glow: "group-hover:shadow-indigo-200" },
] as const;

export const metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const t = await getTranslations("home");
  const s = await getTranslations("services");
  const d = await getTranslations("serviceDesc");
  const pr = await getTranslations("promise");
  const pa = await getTranslations("partner");
  const c = await getTranslations("common");
  const settings = await getSettings();
  const popular = (await getPlaces("food")).slice(0, 4);
  const offers = await getOffers();
  const picks = await getFeatured();
  const locale = await getLocale();
  const { categories: popularCats } = await getMenu(popular.map((p) => p.id));

  return (
    <div className="space-y-10">
      {settings.announcement && (
        <p role="note" className="-mx-4 -mt-6 bg-brand-red px-4 py-2 text-center text-sm font-semibold text-white">
          {settings.announcement}
        </p>
      )}

      <ClosedNotice openTime={settings.open_time} closeTime={settings.close_time} paused={settings.orders_paused} pauseMessage={settings.pause_message} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-[#274e8a] to-ink p-6 pb-52 text-white shadow-pop sm:p-8 sm:pb-64 motion-safe:animate-fade-up">
        <span aria-hidden className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -left-10 top-24 h-24 w-24 rounded-full bg-brand-red/30 blur-xl" />
        <div className="relative">
          <Link href="/areas" className="inline-flex min-h-[32px] items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 transition hover:bg-white/25">
            <span aria-hidden>📍</span> {t("chipAreas")} <span aria-hidden>›</span>
          </Link>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            {t("titleA")} <span className="text-sun">{t("titleB")}</span>
          </h1>
          <p className="mt-3 max-w-md text-white/85">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/food" className="inline-flex min-h-[52px] items-center rounded-xl bg-brand-red px-6 font-bold shadow-lg shadow-black/25 transition active:scale-95">
              <ServiceIcon name="food" className="mr-2 h-6 w-6" /> {t("ctaFood")}
            </Link>
            <Link href="/anything" className="inline-flex min-h-[52px] items-center rounded-xl bg-white/15 px-6 font-bold ring-1 ring-white/35 transition active:scale-95">
              <ServiceIcon name="anything" className="mr-2 h-6 w-6" /> {t("ctaAnything")}
            </Link>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            {[t("chipHours"), t("chipPay"), t("chipWhatsapp")].map((chip) => (
              <li key={chip} className="rounded-full bg-black/20 px-3 py-1 ring-1 ring-white/15">{chip}</li>
            ))}
          </ul>
        </div>
        <HeroScene />
      </section>

      {/* Search straddles the bottom edge of the hero, so it is the first thing a hungry person reaches for. */}
      <div className="relative z-10 !-mt-7"><SearchBar /></div>

      <CravingRow />

      <OffersStrip offers={offers} />

      <ReorderCard />

      {/* Services */}
      <section aria-label="Services" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SERVICES.map((x, i) => (
          <Link
            key={x.key}
            href={x.href}
            style={{ animationDelay: `${i * 60}ms` }}
            className={`group relative flex min-h-[148px] flex-col gap-2 overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${x.glow} active:scale-[0.98] motion-safe:animate-fade-up`}
          >
            <span aria-hidden className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6 ${x.badge}`}>
              <ServiceIcon name={x.key} className="h-9 w-9" />
            </span>
            <span className="mt-1 font-bold leading-tight">{s(x.key)}</span>
            <span className="text-xs leading-snug text-slate-500">{d(x.key)}</span>
            <span aria-hidden className="absolute right-3 top-3 text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-red">→</span>
          </Link>
        ))}
      </section>

      <TodaysPicks picks={picks} />

      {popular.length > 0 && (
        <section className="space-y-4">
          <SectionTitle>{t("popular")}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {popular.map((p) => (
              <PlaceCard key={p.id} place={p} name={pick(p.name, p.name_ne, locale)} tags={placeTags(p.id, popularCats, locale)} />
            ))}
          </div>
        </section>
      )}

      <PartnerStrip title={t("partners")} />

      {/* How it works */}
      <section className="space-y-4">
        <SectionTitle>{t("how")}</SectionTitle>
        <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-[1.1rem] before:top-6 before:border-l-2 before:border-dashed before:border-brand-blue/30">
          {(["1", "2", "3"] as const).map((n) => (
            <li key={n} className="relative flex gap-4">
              <span className="z-10 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-red font-bold text-white shadow-lg shadow-brand-red/30 ring-4 ring-paper">{n}</span>
              <div className="flex-1 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70">
                <p className="font-bold">{t(`step${n}Title`)}</p>
                <p className="mt-0.5 text-sm text-slate-600">{t(`step${n}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust and partners */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/promise" className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 active:scale-[0.98]">
          <span aria-hidden className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-blue-100 text-2xl">🤝</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-brand-blue">{pr("link")}</span>
            <span className="block text-sm text-slate-600">{pr("linkBody")}</span>
          </span>
          <span aria-hidden className="text-slate-300 transition group-hover:text-brand-red">→</span>
        </Link>
        <Link href="/partner" className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 active:scale-[0.98]">
          <span aria-hidden className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-amber-100 text-2xl">🏪</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-brand-blue">{pa("ctaTitle")}</span>
            <span className="block text-sm text-slate-600">{pa("ctaBody")}</span>
          </span>
          <span aria-hidden className="text-slate-300 transition group-hover:text-brand-red">→</span>
        </Link>
      </section>

      {/* Contact */}
      <section className="grid grid-cols-2 gap-3">
        <a href={`tel:+977${settings.phone_numbers[0] ?? settings.whatsapp_number}`} className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-brand-blue font-bold text-white shadow-pop transition active:scale-95">
          <span aria-hidden>📞</span> {c("call")}
        </a>
        <a href={`https://wa.me/977${settings.whatsapp_number}`} className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-green-700 font-bold text-white shadow-lg shadow-green-900/20 transition active:scale-95">
          <span aria-hidden>💬</span> {c("whatsapp")}
        </a>
      </section>
    </div>
  );
}
