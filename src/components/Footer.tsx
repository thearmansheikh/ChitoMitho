import { getTranslations } from "next-intl/server";
import { SITE } from "@/lib/config";

export default async function Footer() {
  const t = await getTranslations("footer");
  const b = await getTranslations("brand");
  const link = "inline-flex min-h-tap items-center font-semibold underline-offset-2 hover:underline";
  return (
    <footer className="mt-10 bg-ink px-4 pb-28 pt-8 text-white md:pb-8">
      <div className="mx-auto max-w-3xl space-y-3 text-sm">
        <p className="text-lg font-extrabold">{b("name")}</p>
        <p>{t("hours")}</p>
        <p className="text-white/80">{t("area")}</p>
        <div className="flex flex-wrap gap-x-5">
          {SITE.phones.map((p) => (
            <a key={p} href={`tel:+977${p}`} className={link}>{t("call")} {p}</a>
          ))}
          <a href={`https://wa.me/977${SITE.whatsappNumber}`} className={link}>{t("whatsapp")}</a>
          <a href={`https://www.tiktok.com/@${SITE.tiktok}`} className={link} target="_blank" rel="noopener noreferrer">{t("tiktok")} @{SITE.tiktok}</a>
          <a href={`https://www.instagram.com/${SITE.instagram}`} className={link} target="_blank" rel="noopener noreferrer">{t("instagram")} @{SITE.instagram}</a>
        </div>
      </div>
    </footer>
  );
}
