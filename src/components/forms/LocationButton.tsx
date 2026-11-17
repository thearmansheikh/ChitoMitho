"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export interface Coords {
  lat: number;
  lng: number;
  accuracy: number; // metres
}

type Problem = "denied" | "failed" | "unsupported" | null;

/**
 * Optional "Share my location" button. The position is only kept in memory and added to the
 * WhatsApp message as a map link; it is never stored by the website or saved on the phone.
 */
export default function LocationButton({ value, onChange, buttonLabel, helpText }: {
  value: Coords | null;
  onChange: (c: Coords | null) => void;
  /** Override the button text, for example "Pin the pickup here". */
  buttonLabel?: string;
  helpText?: string;
}) {
  const t = useTranslations("order");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  function find() {
    setProblem(null);
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return setProblem("unsupported");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoading(false);
        onChange({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
      },
      (e) => {
        setLoading(false);
        setProblem(e.code === e.PERMISSION_DENIED ? "denied" : "failed");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  if (value) {
    const link = `https://www.google.com/maps?q=${value.lat.toFixed(6)},${value.lng.toFixed(6)}`;
    return (
      <div className="space-y-2 rounded-lg border border-green-300 bg-green-50 p-3">
        <p className="font-semibold text-green-900">
          ✅ {t("locationAdded")} <span className="font-normal">(±{Math.max(1, Math.round(value.accuracy))} m)</span>
        </p>
        {value.accuracy > 300 && <p role="status" className="text-sm text-yellow-900">{t("locationApprox")}</p>}
        <div className="flex flex-wrap gap-2">
          <a href={link} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center rounded-lg border border-green-700 px-3 text-sm font-semibold text-green-900">
            🗺️ {t("locationView")}
          </a>
          <button type="button" onClick={() => onChange(null)} className="min-h-[44px] rounded-lg px-3 text-sm font-semibold text-brand-red">
            {t("locationRemove")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={find} disabled={loading}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-brand-blue font-semibold text-brand-blue disabled:opacity-60">
        📍 {loading ? t("locating") : buttonLabel ?? t("shareLocation")}
      </button>
      <p className="text-xs text-slate-600">{helpText ?? t("locationHelp")}</p>
      {problem && (
        <p role="alert" className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900">
          {problem === "denied" ? t("locationDenied") : problem === "unsupported" ? t("locationUnsupported") : t("locationFailed")}
        </p>
      )}
    </div>
  );
}
