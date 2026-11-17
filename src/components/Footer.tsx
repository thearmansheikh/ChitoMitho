import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import { SITE } from "@/lib/config";

export default async function Footer() {
  const t = await getTranslations("footer");
  const b = await getTranslations("brand");
  const a = await getTranslations("about");
  const n = await getTranslations("nav");
  const s = await getSettings();
  const link = "inline-flex min-h-tap items-center rounded-lg px-1 font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline";
  return (
    <footer className="relative mt-14 overflow-hidden bg-gradient-to-b from-ink to-[#0f1a33] px-4 pb-32 pt-10 text-white md:pb-10">
      <span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-red/20 blur-2xl" />
      <div className="relative mx-auto max-w-3xl space-y-5 text-sm">
        <div className="flex items-center gap-3">
          <Image src="/icons/logo.png" alt="" width={48} height={48} className="rounded-full ring-2 ring-white/30" />
          <div>
            <p className="text-lg font-bold leading-tight">{b("name")}</p>
            <p className="text-white/70">{b("tagline")}</p>
          </div>
        </div>
        <p className="font-semibold text-sun">🕙 {t("hours")}</p>
        <p className="text-white/75">{t("area")}</p>
        <div className="flex flex-wrap gap-x-4">
          {s.phone_numbers.map((p) => (
            <a key={p} href={`tel:+977${p}`} className={link}>{t("call")} {p}</a>
          ))}
          <a href={`https://wa.me/977${s.whatsapp_number}`} className={link}>{t("whatsapp")}</a>
          <a href={`https://www.tiktok.com/@${SITE.tiktok}`} className={link} target="_blank" rel="noopener noreferrer">{t("tiktok")} @{SITE.tiktok}</a>
          <a href={`https://www.instagram.com/${SITE.instagram}`} className={link} target="_blank" rel="noopener noreferrer">{t("instagram")} @{SITE.instagram}</a>
        </div>
        <nav aria-label={n("order")} className="flex flex-wrap gap-x-4 border-t border-white/10 pt-3">
          <Link href="/food" className={link}>{n("food")}</Link>
          <Link href="/groceries" className={link}>{n("grocery")}</Link>
          <Link href="/liquor" className={link}>{n("liquor")}</Link>
          <Link href="/gifts" className={link}>{n("gifts")}</Link>
          <Link href="/parcel" className={link}>{n("parcel")}</Link>
          <Link href="/anything" className={link}>{n("anything")}</Link>
        </nav>
        <div className="flex flex-wrap gap-x-4 border-t border-white/10 pt-3">
          <Link href="/about" className={link}>{a("link")}</Link>
          <Link href="/promise" className={link}>{n("promise")}</Link>
          <Link href="/partner" className={link}>{n("partner")}</Link>
          <Link href="/areas" className={link}>{n("areas")}</Link>
          <Link href="/help" className={link}>{n("help")}</Link>
          <Link href="/privacy" className={link}>{n("privacy")}</Link>
          <Link href="/terms" className={link}>{n("terms")}</Link>
        </div>
      </div>
    </footer>
  );
}
