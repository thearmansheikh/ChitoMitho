import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import { SITE } from "@/lib/config";

export default async function Footer() {
  const t = await getTranslations("footer");
  const b = await getTranslations("brand");
  const a = await getTranslations("about");
  const s = await getSettings();
  const link = "inline-flex min-h-tap items-center font-semibold underline-offset-2 hover:underline";
  return (
    <footer className="mt-10 bg-ink px-4 pb-28 pt-8 text-white md:pb-8">
      <div className="mx-auto max-w-3xl space-y-3 text-sm">
        <p className="text-lg font-extrabold">{b("name")}</p>
        <p>{t("hours")}</p>
        <p className="text-white/80">{t("area")}</p>
        <div className="flex flex-wrap gap-x-5">
          {s.phone_numbers.map((p) => (
            <a key={p} href={`tel:+977${p}`} className={link}>{t("call")} {p}</a>
          ))}
          <a href={`https://wa.me/977${s.whatsapp_number}`} className={link}>{t("whatsapp")}</a>
          <a href={`https://www.tiktok.com/@${SITE.tiktok}`} className={link} target="_blank" rel="noopener noreferrer">{t("tiktok")} @{SITE.tiktok}</a>
          <a href={`https://www.instagram.com/${SITE.instagram}`} className={link} target="_blank" rel="noopener noreferrer">{t("instagram")} @{SITE.instagram}</a>
          <Link href="/about" className={link}>{a("link")}</Link>
        </div>
      </div>
    </footer>
  );
}
