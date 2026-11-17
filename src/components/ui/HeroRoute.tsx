/**
 * Decorative route from a scooter to a pin: the idea of "from anywhere, to your door".
 * Purely visual, so it is hidden from screen readers. The dashes and pin gently move,
 * and stop for people who prefer reduced motion.
 */
export default function HeroRoute() {
  return (
    <svg aria-hidden viewBox="0 0 360 96" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full" preserveAspectRatio="xMidYMax meet">
      {/* route */}
      <path
        d="M52 74 C 110 18, 150 96, 206 50 S 292 16, 318 44"
        fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8"
        className="motion-safe:animate-dash"
      />
      {/* scooter */}
      <g transform="translate(8 40)">
        <rect x="2" y="6" width="17" height="15" rx="3.5" fill="#D62828" />
        <path d="M6 31 H30 L38 12 H46" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="34" r="7" fill="#fff" />
        <circle cx="12" cy="34" r="2.6" fill="#1A2B4C" />
        <circle cx="40" cy="34" r="7" fill="#fff" />
        <circle cx="40" cy="34" r="2.6" fill="#1A2B4C" />
      </g>
      {/* destination pin */}
      <g className="motion-safe:animate-float" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <path d="M318 8 c-9 0 -16 7 -16 16 c0 12 16 28 16 28 s16 -16 16 -28 c0 -9 -7 -16 -16 -16z" fill="#FFC857" />
        <circle cx="318" cy="24" r="6" fill="#1A2B4C" />
      </g>
    </svg>
  );
}
