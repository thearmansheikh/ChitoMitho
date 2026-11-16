import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="space-y-4 py-10 text-center">
      <p className="text-6xl" aria-hidden>🛵</p>
      <h1 className="text-2xl font-extrabold text-brand-blue">{t("notFoundTitle")}</h1>
      <p className="mx-auto max-w-sm text-slate-600">{t("notFoundBody")}</p>
      <Link href="/" className="inline-flex min-h-[52px] items-center rounded-xl bg-brand-blue px-6 font-bold text-white">{t("goHome")}</Link>
    </div>
  );
}
