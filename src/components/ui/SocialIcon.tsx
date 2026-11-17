export type SocialIconName = "whatsapp" | "phone" | "tiktok" | "instagram";

/** Simple outline icons drawn for the footer. They inherit the text colour, so they work on any background. */
export default function SocialIcon({ name, className = "h-5 w-5" }: { name: SocialIconName; className?: string }) {
  return (
    <svg
      aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"
    >
      {name === "whatsapp" && (
        <>
          <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
          <path d="M9.2 8.6c-.3.6-.2 1.7.9 3.2 1.200 1.700 2.600 2.600 3.800 2.800.7.1 1.400-.4 1.600-1l-1.500-.9-.8.6c-.9-.3-1.700-1.100-2.200-2l.6-.8-.8-1.600z" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "phone" && <path d="M5 4h3.500l1.800 4.500-2.200 1.400a11 11 0 0 0 5 5l1.400-2.200L19 14.500V18a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2z" />}
      {name === "tiktok" && (
        <>
          <path d="M14 3v10.500a3.500 3.500 0 1 1-3.500-3.500" />
          <path d="M14 3c.3 2.400 2 4.100 4.500 4.300" />
        </>
      )}
      {name === "instagram" && (
        <>
          <rect x="3.500" y="3.500" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.200" cy="6.800" r="1" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
