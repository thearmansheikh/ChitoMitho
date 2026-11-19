import Image from "next/image";
import { firstLetter } from "@/lib/image";

/** A place's own logo in a circle, or its first letter when it has none. Never shows the Chitto Mitho logo. */
export default function PlaceLogo({ logoUrl, name, size = 44, className = "" }: { logoUrl: string | null; name: string; size?: number; className?: string }) {
  const box = { width: size, height: size };
  if (logoUrl) {
    return <Image src={logoUrl} alt={name} width={size} height={size} loading="lazy" style={box} className={`rounded-full bg-white object-cover ring-2 ring-white ${className}`} />;
  }
  return (
    <span aria-hidden style={{ ...box, fontSize: size * 0.45 }} className={`flex items-center justify-center rounded-full bg-white font-extrabold text-brand-blue ring-2 ring-white ${className}`}>
      {firstLetter(name)}
    </span>
  );
}
