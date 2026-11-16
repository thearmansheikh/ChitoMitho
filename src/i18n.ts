import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "@/lib/locale";

export default getRequestConfig(async () => {
  const c = cookies().get(LOCALE_COOKIE)?.value;
  const locale: Locale = locales.includes(c as Locale) ? (c as Locale) : defaultLocale;
  return {
    locale,
    timeZone: "Asia/Kathmandu",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
