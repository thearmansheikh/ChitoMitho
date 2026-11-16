import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("home");
  return (
    <section className="rounded-2xl bg-brand-blue p-6 text-white">
      <h1 className="text-3xl font-extrabold leading-tight">{t("title")}</h1>
      <p className="mt-3 text-white/90">{t("subtitle")}</p>
      <p className="mt-4 inline-block rounded-lg bg-brand-red px-3 py-2 text-sm font-semibold">{t("placeholder")}</p>
    </section>
  );
}
