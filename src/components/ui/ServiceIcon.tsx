export type ServiceIconName = "food" | "grocery" | "liquor" | "gifts" | "parcel" | "anything";

/**
 * Hand-drawn flat icons in the Chitto Mitho palette. Used instead of emoji so every phone shows
 * the same picture, and small enough (a few hundred bytes each) to cost nothing in speed.
 */
export default function ServiceIcon({ name, className = "h-9 w-9" }: { name: ServiceIconName; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {name === "food" && (
        <>
          <path d="M8 22c0-8 7-13 16-13s16 5 16 13z" fill="#F2A33A" />
          <circle cx="17" cy="16" r="1.3" fill="#FFF3D6" />
          <circle cx="24" cy="13.5" r="1.3" fill="#FFF3D6" />
          <circle cx="31" cy="16" r="1.3" fill="#FFF3D6" />
          <circle cx="21" cy="19" r="1.1" fill="#FFF3D6" />
          <circle cx="28" cy="19.5" r="1.1" fill="#FFF3D6" />
          <path d="M6 25c3 2.4 5-1.6 8 0s5-1.6 9 0 5-1.6 8 0 5-1.6 9 0v3H6z" fill="#4CB36B" />
          <rect x="7" y="29" width="34" height="6" rx="3" fill="#7A3E1D" />
          <path d="M9 37h30c0 4-3 6-7 6H16c-4 0-7-2-7-6z" fill="#F2A33A" />
        </>
      )}
      {name === "grocery" && (
        <>
          <path d="M4 8h6l4 22h21l4-16H12" stroke="#1A2B4C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 14h26l-3.5 14H16z" fill="#34B27B" />
          <path d="M20 14l1.5 14M27 14v14M34 14l-1.5 14" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" />
          <circle cx="19" cy="37" r="3.2" fill="#1A2B4C" />
          <circle cx="32" cy="37" r="3.2" fill="#1A2B4C" />
          <circle cx="24" cy="10" r="3.6" fill="#E5484D" />
          <path d="M24 7c0-2 1-3 3-3" stroke="#4CB36B" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {name === "liquor" && (
        <>
          <rect x="9" y="16" width="23" height="25" rx="4" fill="#F5B83D" />
          <rect x="13" y="19" width="3" height="19" rx="1.5" fill="#fff" fillOpacity=".5" />
          <path d="M32 22h3.5c3.2 0 4.5 2 4.5 5s-1.3 5-4.5 5H32" stroke="#F5B83D" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="14.5" cy="15" r="5" fill="#fff" />
          <circle cx="21.5" cy="12.5" r="6" fill="#fff" />
          <circle cx="28" cy="15" r="5" fill="#fff" />
          <rect x="9" y="15" width="23" height="4" fill="#fff" />
        </>
      )}
      {name === "gifts" && (
        <>
          <path d="M24 30V20M17 30c-2-5-1-9 2-11M31 30c2-5 1-9-2-11" stroke="#3E9B5C" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="24" cy="14" r="6" fill="#E5484D" />
          <circle cx="24" cy="14" r="2.2" fill="#FFC857" />
          <circle cx="14.5" cy="19" r="5.2" fill="#F06292" />
          <circle cx="14.5" cy="19" r="1.9" fill="#FFE3EC" />
          <circle cx="33.5" cy="19" r="5.2" fill="#FFC857" />
          <circle cx="33.5" cy="19" r="1.9" fill="#F2A33A" />
          <path d="M12 28h24l-6 16H18z" fill="#E8B27A" />
          <path d="M20 44l-1.5-8M28 44l1.5-8" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" />
          <path d="M18 31h12" stroke="#D62828" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {name === "parcel" && (
        <>
          <path d="M6 16 24 8l18 8v20L24 44 6 36z" fill="#D9A066" />
          <path d="M6 16 24 24l18-8" stroke="#B87C45" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M24 24v20" stroke="#B87C45" strokeWidth="1.6" />
          <path d="M15 12l18 8v6" stroke="#F2C48D" strokeWidth="4" strokeLinejoin="round" />
          <rect x="28" y="30" width="9" height="6" rx="1" fill="#fff" transform="rotate(-8 28 30)" />
        </>
      )}
      {name === "anything" && (
        <>
          <path d="M11 18h26l2 24H9z" fill="#2E5A9C" />
          <path d="M17 18c0-5 3-8 7-8s7 3 7 8" stroke="#1A2B4C" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 24l1.6 3.4 3.6.4-2.7 2.5.8 3.6L24 32l-3.3 1.9.8-3.6-2.7-2.5 3.6-.4z" fill="#FFC857" />
          <path d="M39 6l1.2 2.8L43 10l-2.8 1.2L39 14l-1.2-2.8L35 10l2.8-1.2z" fill="#FFC857" />
        </>
      )}
    </svg>
  );
}
