import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPlaces, getSettings } from "@/lib/data";
import PlaceCard from "@/components/shop/PlaceCard";
import ClosedNotice from "@/components/shop/ClosedNotice";

const SERVICES = [
  { href: "/food", key: "food", icon: "🍔" },
  { href: "/groceries", key: "grocery", icon: "🛒" },
  { href: "/liquor", key: "liquor", icon: "🍺" },
  { href: "/gifts", key: "gifts", icon: "💐" },
  { href: "/parcel", key: "parcel", icon: "📦" },
  { href: "/anything", key: "anything", icon: "✨" },
] as const;

export default async function Home() {
  const t = await getTranslations("home");
  const s = await getTranslations("services");
  const settings = await getSettings();
  const popular = (await getPlaces("food")).slice(0, 4);

  return (
    <div className="space-y-8">
      {settings.announcement && (
        <p role="note" className="-mx-4 -mt-6 bg-brand-red px-4 py-2 text-center text-sm font-semibold text-white">
          {settings.announcement}
        </p>
      )}

      <ClosedNotice openTime={settings.open_time} closeTime={settings.close_time} paused={settings.orders_paused} pauseMessage={settings.pause_message} />

      <section className="rounded-2xl bg-brand-blue p-6 text-white">
        <h1 className="text-3xl font-extrabold leading-tight">{t("title")}</h1>
        <p className="mt-3 text-white/90">{t("subtitle")}</p>
      </section>

      <section aria-label="Services" className="grid grid-cols-2 gap-3">
        {SERVICES.map((x) => (
          <Link key={x.key} href={x.href}
            className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 p-3 text-center font-bold shadow-sm active:bg-slate-50">
            <span className="text-4xl" aria-hidden>{x.icon}</span>
            {s(x.key)}
          </Link>
        ))}
      </section>

      {popular.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">{t("popular")}</h2>
          <div className="space-y-2">{popular.map((p) => <PlaceCard key={p.id} place={p} />)}</div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">{t("how")}</h2>
        <ol className="space-y-3">
          {(["1", "2", "3"] as const).map((n) => (
            <li key={n} className="flex gap-3 rounded-xl bg-slate-50 p-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-red font-bold text-white">{n}</span>
              <div>
                <p className="font-bold">{t(`step${n}Title`)}</p>
                <p className="text-sm text-slate-600">{t(`step${n}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <a href={`tel:+977${settings.phone_numbers[0] ?? settings.whatsapp_number}`} className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand-blue font-bold text-white">
          📞 {(await getTranslations("common"))("call")}
        </a>
        <a href={`https://wa.me/977${settings.whatsapp_number}`} className="flex min-h-[52px] items-center justify-center rounded-xl bg-green-700 font-bold text-white">
          💬 {(await getTranslations("common"))("whatsapp")}
        </a>
      </section>
    </div>
  );
}
