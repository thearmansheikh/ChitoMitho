import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import { SITE } from "@/lib/config";
import SocialIcon from "@/components/ui/SocialIcon";

export default async function Footer() {
  const t = await getTranslations("footer");
  const b = await getTranslations("brand");
  const a = await getTranslations("about");
  const n = await getTranslations("nav");
  const s = await getSettings();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("colOrder"),
      links: [
        { href: "/food", label: n("food") },
        { href: "/groceries", label: n("grocery") },
        { href: "/liquor", label: n("liquor") },
        { href: "/gifts", label: n("gifts") },
        { href: "/parcel", label: n("parcel") },
        { href: "/anything", label: n("anything") },
      ],
    },
    {
      title: t("colCompany"),
      links: [
        { href: "/about", label: a("link") },
        { href: "/promise", label: n("promise") },
        { href: "/partner", label: n("partner") },
      ],
    },
    {
      title: t("colHelp"),
      links: [
        { href: "/areas", label: n("areas") },
        { href: "/help", label: n("help") },
        { href: "/privacy", label: n("privacy") },
        { href: "/terms", label: n("terms") },
      ],
    },
  ];

  const social = "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white hover:text-ink";

  return (
    <footer className="relative mt-16 overflow-hidden bg-ink text-white">
      {/* soft colour glows, purely decorative */}
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-red/25 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-brand-blue/30 blur-3xl" />
      {/* a red edge ties the footer to the rest of the site */}
      <div aria-hidden className="h-1 bg-gradient-to-r from-brand-red via-sun to-brand-blue" />

      <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-12 md:pb-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)]">
          {/* Brand and contact */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Image src="/icons/logo.png" alt="" width={56} height={56} className="rounded-full ring-2 ring-white/30" />
              <div>
                <p className="text-xl font-bold leading-tight">{b("name")}</p>
                <p className="text-sm text-white/70">{b("tagline")}</p>
              </div>
            </div>

            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-sun ring-1 ring-white/15">
              <span aria-hidden>🕙</span> {t("hoursDynamic", { open: s.open_time.slice(0, 5), close: s.close_time.slice(0, 5) })}
            </p>
            <p className="max-w-sm text-sm text-white/70">{t("area")}</p>

            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">{t("contact")}</h2>
              <a
                href={`https://wa.me/977${s.whatsapp_number}`}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-green-600 px-5 font-bold text-white shadow-lg shadow-black/20 transition hover:bg-green-500 active:scale-95 sm:max-w-xs"
              >
                <SocialIcon name="whatsapp" className="h-5 w-5" /> {t("whatsapp")} · {s.whatsapp_number}
              </a>
              <div className="flex flex-wrap gap-2">
                {s.phone_numbers.map((p) => (
                  <a
                    key={p}
                    href={`tel:+977${p}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10"
                  >
                    <SocialIcon name="phone" className="h-4 w-4" /> {p}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">{t("follow")}</h2>
              <div className="flex gap-3">
                <a href={`https://www.tiktok.com/@${SITE.tiktok}`} target="_blank" rel="noopener noreferrer" aria-label={`${t("tiktok")} @${SITE.tiktok}`} className={social}>
                  <SocialIcon name="tiktok" />
                </a>
                <a href={`https://www.instagram.com/${SITE.instagram}`} target="_blank" rel="noopener noreferrer" aria-label={`${t("instagram")} @${SITE.instagram}`} className={social}>
                  <SocialIcon name="instagram" />
                </a>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <nav aria-label={n("info")} className="grid grid-cols-2 content-start gap-x-6 gap-y-6 sm:grid-cols-3">
            {columns.map((col, i) => (
              // On phones the first column runs down the left and the other two stack on the right.
              <div key={col.title} className={`space-y-2 ${i === 0 ? "row-span-2 sm:row-span-1" : ""}`}>
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">{col.title}</h2>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-flex min-h-[40px] items-center text-sm font-medium text-white/85 underline-offset-4 transition hover:text-white hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t border-white/10 pt-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights", { year })}</p>
          <p>{t("madeIn")}</p>
        </div>
      </div>
    </footer>
  );
}
