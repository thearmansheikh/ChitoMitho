"use client";

import { useTranslations } from "next-intl";

/** A red * after a label for a required field. Screen readers hear "(required)" instead of "star". */
export default function Req() {
  const t = useTranslations("common");
  return (
    <>
      <span aria-hidden className="ml-0.5 text-brand-red">*</span>
      <span className="sr-only"> ({t("requiredWord")})</span>
    </>
  );
}
