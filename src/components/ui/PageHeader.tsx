import Image from "next/image";
import type { ReactNode } from "react";

const TONES = {
  blue: "from-brand-blue to-[#1f3f73]",
  red: "from-brand-red to-[#9d1c1c]",
  green: "from-emerald-600 to-emerald-800",
  amber: "from-amber-500 to-orange-600",
  pink: "from-rose-500 to-pink-700",
  ink: "from-ink to-[#0f1a33]",
} as const;

export type Tone = keyof typeof TONES;

/**
 * Coloured banner at the top of a page: an icon, a title and an optional line of help.
 * With a photo, the photo fills the banner and a dark fade keeps the white text readable.
 */
export default function PageHeader({ icon, title, subtitle, tone = "blue", image }: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  tone?: Tone;
  image?: string | null;
}) {
  return (
    <header className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${TONES[tone]} p-5 text-white shadow-pop motion-safe:animate-fade-up ${image ? "min-h-[150px]" : ""}`}>
      {image ? (
        <>
          <Image src={image} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        </>
      ) : (
        <>
          <span aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <span aria-hidden className="absolute -bottom-10 right-12 h-20 w-20 rounded-full bg-white/10" />
        </>
      )}
      <div className={`relative flex gap-4 ${image ? "h-full min-h-[110px] items-end" : "items-center"}`}>
        <span aria-hidden className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm">{icon}</span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight drop-shadow-sm">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-white/90">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
