import { ScooterRider } from "./ScooterArt";

/**
 * Illustration at the foot of the home hero: foothills, a few lit buildings, a road, and a rider
 * heading for a pin. The ground is drawn far beyond the picture so it fills wide screens.
 * Purely decorative, so it is hidden from screen readers. Motion stops for reduced-motion users.
 */
export default function HeroScene() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex h-44 justify-center overflow-hidden sm:h-52">
      <svg viewBox="0 0 400 176" className="h-full w-full max-w-[560px] overflow-visible" preserveAspectRatio="xMidYMax meet">
        {/* far hills */}
        <path d="M-700 120C-600 92 -500 112 -400 98S-200 76 -100 102 60 84 150 98s140-26 230 6 220-10 320 8 220 4 300-6V176H-700z" fill="#fff" fillOpacity=".08" />
        {/* buildings with lit windows */}
        <g fill="#fff" fillOpacity=".12">
          <rect x="14" y="98" width="20" height="52" rx="2" />
          <rect x="38" y="88" width="24" height="62" rx="2" />
          <rect x="66" y="108" width="16" height="42" rx="2" />
          <rect x="296" y="96" width="22" height="54" rx="2" />
          <rect x="322" y="84" width="26" height="66" rx="2" />
          <rect x="352" y="106" width="18" height="44" rx="2" />
        </g>
        <g fill="#FFC857" fillOpacity=".75">
          <rect x="20" y="106" width="4" height="4" /><rect x="26" y="116" width="4" height="4" />
          <rect x="44" y="96" width="4" height="4" /><rect x="52" y="108" width="4" height="4" /><rect x="46" y="122" width="4" height="4" />
          <rect x="302" y="104" width="4" height="4" /><rect x="310" y="118" width="4" height="4" />
          <rect x="328" y="94" width="4" height="4" /><rect x="338" y="106" width="4" height="4" /><rect x="330" y="122" width="4" height="4" />
        </g>
        {/* near hills + road */}
        <path d="M-700 142C-600 122 -500 140 -400 130S-200 116 -100 134 80 122 190 132s150-18 250 2 200-6 300 6V176H-700z" fill="#0F1A33" fillOpacity=".35" />
        <rect x="-700" y="148" width="1800" height="40" fill="#0F1A33" fillOpacity=".6" />
        <path d="M-700 162H1100" stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" strokeDasharray="12 14" className="motion-safe:animate-dash" />
        {/* route to the pin */}
        <path d="M166 122C206 84 250 126 294 86S334 60 346 58" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" className="motion-safe:animate-dash" />
        {/* pin */}
        <g className="motion-safe:animate-float" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <path d="M346 30c-10 0-17 7-17 17 0 13 17 30 17 30s17-17 17-30c0-10-7-17-17-17z" fill="#FFC857" />
          <circle cx="346" cy="47" r="6.5" fill="#1A2B4C" />
        </g>
        {/* rider, wheels resting on the road */}
        <g transform="translate(58 74) scale(1.35)">
          <g className="motion-safe:animate-bob" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <ScooterRider />
          </g>
        </g>
      </svg>
    </div>
  );
}
