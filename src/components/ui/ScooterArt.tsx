/** The delivery rider: a red box on the back, a scooter and a rider in a red jacket. Drawn on a 90 x 62 grid. */
export function ScooterRider() {
  return (
    <g>
      {/* delivery box */}
      <rect x="0" y="10" width="27" height="22" rx="4" fill="#D62828" />
      <rect x="0" y="10" width="27" height="6" rx="3" fill="#B31F1F" />
      <text x="13.5" y="27" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="sans-serif">CM</text>
      {/* scooter body */}
      <path d="M16 38c0-6 6-8 14-8h22l9 12H20c-3 0-4-2-4-4z" fill="#fff" />
      <path d="M52 14h8l7 28H57z" fill="#fff" />
      <path d="M51 12l12-3" stroke="#1A2B4C" strokeWidth="3" strokeLinecap="round" />
      <rect x="24" y="25" width="22" height="6" rx="3" fill="#1A2B4C" />
      {/* rider */}
      <path d="M36 26l8 13h9" stroke="#2E5A9C" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 27c-1-12 4-19 12-18l5 12-3 8z" fill="#D62828" />
      <path d="M44 14l13-3" stroke="#D62828" strokeWidth="5" strokeLinecap="round" />
      <circle cx="43" cy="3" r="7" fill="#FFD1A8" />
      <path d="M35.5 4a7.5 7.5 0 0 1 15 0z" fill="#1A2B4C" />
      <rect x="45" y="3" width="6" height="3" rx="1.5" fill="#1A2B4C" />
      {/* wheels */}
      <circle cx="22" cy="48" r="8" fill="#1A2B4C" />
      <circle cx="22" cy="48" r="3" fill="#fff" />
      <circle cx="62" cy="48" r="8" fill="#1A2B4C" />
      <circle cx="62" cy="48" r="3" fill="#fff" />
    </g>
  );
}

/** Standalone rider for empty and error pages. */
export default function ScooterArt({ className = "h-28 w-auto" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="-4 -8 98 74" className={className} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="42" cy="58" rx="40" ry="3.5" fill="#1A2B4C" fillOpacity=".12" />
      <g className="motion-safe:animate-bob" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <ScooterRider />
      </g>
    </svg>
  );
}
