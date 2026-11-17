import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ScooterArt from "@/components/ui/ScooterArt";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="flex flex-col items-center space-y-4 py-10 text-center">
      <ScooterArt className="h-32 w-auto" />
      <p className="text-5xl font-bold tracking-tight text-brand-red">404</p>
      <h1 className="text-2xl font-bold text-brand-blue">{t("notFoundTitle")}</h1>
      <p className="mx-auto max-w-sm text-slate-600">{t("notFoundBody")}</p>
      <Link href="/" className="inline-flex min-h-[52px] items-center rounded-xl bg-brand-blue px-6 font-bold text-white shadow-pop transition active:scale-95">{t("goHome")}</Link>
    </div>
  );
}
