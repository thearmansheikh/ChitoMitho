import Image from "next/image";

const PARTNERS = [
  ["anzees-cafe-bakery", "Anzee's Cafe & Bakery"],
  ["sweet-treats", "Sweet Treats Bakery, Cake and Gifts"],
  ["the-cake-palace", "The Cake Palace"],
  ["sam-cafe-restro", "SAM Cafe & Restro"],
  ["youberry-restaurant", "Youberry Restaurant"],
  ["circle-cafe-bar", "Circle Café & Bar"],
  ["tiffin-by-saze", "Tiffin by Saze"],
  ["swad-restro", "स्वाद Restro"],
] as const;

export default function PartnerStrip({ title }: { title: string }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <p className="text-center text-sm font-semibold text-slate-600">{title}</p>
      <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {PARTNERS.map(([file, name]) => (
          <li key={file} className="aspect-square overflow-hidden rounded-full bg-white shadow-card ring-1 ring-slate-200/70">
            <Image src={`/images/partners/${file}.webp`} alt={name} width={128} height={128} loading="lazy" className="h-full w-full object-cover" />
          </li>
        ))}
      </ul>
    </section>
  );
}
