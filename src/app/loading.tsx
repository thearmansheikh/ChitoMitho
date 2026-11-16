import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("a11y");
  return (
    <div role="status" aria-busy="true" aria-label={t("loading")} className="animate-pulse space-y-4">
      <div className="h-8 w-1/2 rounded-lg bg-slate-200" />
      <div className="h-32 rounded-2xl bg-slate-200" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <div className="h-14 w-14 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/3 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
