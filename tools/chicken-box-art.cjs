const sharp = require("sharp");
const out = "public/images/menu/the-chicken-box/";

const frame = (bg1, bg2, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient><linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs><rect width="240" height="240" fill="url(#bg)"/><circle cx="205" cy="35" r="62" fill="#fff" opacity=".22"/><circle cx="25" cy="215" r="48" fill="#fff" opacity=".18"/><ellipse cx="120" cy="208" rx="78" ry="9" fill="#000" opacity=".16"/>${inner}</svg>`;

/* ---------- sandwich ---------- */
const breadBottom = (y) => `<path d="M44 ${y} q0 22 14 24 H182 q14 -2 14 -24Z" fill="#E8B766" stroke="#B9822F" stroke-width="3" stroke-linejoin="round"/><path d="M56 ${y + 8} H184" stroke="#F6D99B" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
const breadTop = (y) => `<path d="M44 ${y + 26} q-6 -30 14 -34 H182 q20 4 14 34Z" fill="#E8B766" stroke="#B9822F" stroke-width="3" stroke-linejoin="round"/><path d="M56 ${y + 12} H184" stroke="#F6D99B" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
const lettuce = (y) => `<path d="M38 ${y} q12 -14 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 v10 H38Z" fill="#59B34A" stroke="#3D8A33" stroke-width="2.5" stroke-linejoin="round"/>`;
const tomato = (y) => [62, 100, 138, 176].map((x) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="6.5" fill="#E8412F" stroke="#B72A1C" stroke-width="2"/>`).join("");
const cheese = (y) => `<path d="M42 ${y} H198 l-10 14 -14 -9 -16 12 -16 -11 -16 11 -16 -11 -16 12 -16 -10 -12 9Z" fill="#FFC93C" stroke="#D9A00F" stroke-width="2.5" stroke-linejoin="round"/>`;
const patty = (y) => `<rect x="44" y="${y}" width="152" height="20" rx="10" fill="#B8662A" stroke="#85471B" stroke-width="2.5"/><path d="M58 ${y + 7} h26 M104 ${y + 12} h30 M150 ${y + 7} h26" stroke="#E0A060" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
const paneer = (y) => [56, 86, 116, 146, 176].map((x, i) => `<rect x="${x - 10}" y="${y + (i % 2 ? 2 : -2)}" width="20" height="17" rx="4" fill="#F4C27A" stroke="#C8863A" stroke-width="2"/>`).join("");
const corn = (y) => Array.from({ length: 17 }, (_, i) => `<circle cx="${52 + (i % 9) * 17 + (i >= 9 ? 8 : 0)}" cy="${y + 3 + Math.floor(i / 9) * 9}" r="5" fill="#FFD84A" stroke="#E0A800" stroke-width="1.5"/>`).join("");
const pick = `<path d="M120 40 V132" stroke="#C9A06B" stroke-width="4" stroke-linecap="round"/><circle cx="120" cy="38" r="9" fill="#C9302C"/><circle cx="117" cy="35" r="3" fill="#fff" opacity=".6"/>`;
const sandwich = (kind) => {
  const mid = {
    chicken: tomato(128) + patty(106) + lettuce(104),
    paneer: paneer(108) + lettuce(104),
    veg: tomato(118) + lettuce(104),
    corn: cheese(120) + corn(100) + lettuce(96),
  }[kind];
  return frame("#FFE3B3", "#FFB866", `${breadBottom(128)}${mid}${breadTop(66)}${pick}<rect x="44" y="70" width="152" height="10" rx="5" fill="url(#gl)"/>`);
};

/* ---------- wrap ---------- */
const wrapArt = (kind) => {
  const fill = { chicken: ["#A85A24", "#C9772F", "#59B34A", "#E8412F"], paneer: ["#F4C27A", "#E0A860", "#59B34A", "#E8412F"], veg: ["#59B34A", "#E8412F", "#B07CC6", "#FFC93C"] }[kind];
  const dots = Array.from({ length: 11 }, (_, i) => {
    const a = i * 2.2, r = 2 + (i % 4) * 5.5;
    return `<circle cx="${(180 + Math.cos(a) * r * 0.7).toFixed(1)}" cy="${(125 + Math.sin(a) * r * 1.1).toFixed(1)}" r="${5 + (i % 3)}" fill="${fill[i % 4]}" stroke="#0003" stroke-width="1.2"/>`;
  }).join("");
  const tort = "#F2D7A0", tortS = "#C99B4E";
  return frame("#FFE9C2", "#FF9F6B", `<g transform="rotate(-28 120 125)"><rect x="42" y="92" width="150" height="66" rx="30" fill="${tort}" stroke="${tortS}" stroke-width="3.5"/><path d="M42 130 H128 V150 q0 14 -14 14 H56 q-14 0 -14 -14Z" fill="#E8EDF2" stroke="#9FB0C2" stroke-width="3"/><path d="M62 134 v26 M84 134 v26 M106 134 v26" stroke="#9FB0C2" stroke-width="2" opacity=".7"/><rect x="42" y="92" width="150" height="66" rx="30" fill="url(#gl)"/><ellipse cx="180" cy="125" rx="26" ry="34" fill="${tort}" stroke="${tortS}" stroke-width="3.5"/><ellipse cx="180" cy="125" rx="19" ry="27" fill="#FFF3D6" stroke="#E4C98B" stroke-width="2"/>${dots}</g>`);
};

/* ---------- drinks ---------- */
const iceCubes = [[95, 100], [125, 92], [108, 128], [138, 118], [100, 160], [130, 150]]
  .map(([x, y]) => `<rect x="${x}" y="${y}" width="24" height="24" rx="5" fill="#fff" opacity=".42" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" transform="rotate(${(x % 17) - 8} ${x + 12} ${y + 12})"/>`).join("");
const glass = ({ bg, liquid, top = liquid, garnish = "", bubbles = false, straw = "#E8412F" }) => frame(bg[0], bg[1], `<defs><clipPath id="g"><path d="M80 62 H160 L150 196 H90Z"/></clipPath><linearGradient id="lq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${liquid}"/></linearGradient></defs><path d="M112 22 L142 14 L146 24 L125 100" stroke="${straw}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M80 62 H160 L150 196 H90Z" fill="#fff" opacity=".45"/><g clip-path="url(#g)"><rect x="70" y="84" width="100" height="120" fill="url(#lq)"/>${iceCubes}${bubbles ? Array.from({ length: 16 }, (_, i) => `<circle cx="${92 + ((i * 37) % 62)}" cy="${96 + ((i * 53) % 92)}" r="${2 + (i % 3)}" fill="#fff" opacity=".7"/>`).join("") : ""}</g><path d="M80 62 H160 L150 196 H90Z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round" opacity=".9"/><path d="M88 70 L96 188" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".55"/><ellipse cx="120" cy="62" rx="40" ry="6" fill="#fff" opacity=".6"/>${garnish}`);
const mint = `<g transform="translate(128 50)"><path d="M0 8 q-14 -4 -20 -22 q18 -2 22 16Z" fill="#3DAA4E" stroke="#27793A" stroke-width="2"/><path d="M0 8 q14 -6 22 -24 q-18 0 -22 18Z" fill="#59C760" stroke="#27793A" stroke-width="2"/><path d="M0 8 q-2 -16 4 -30 q10 14 -4 30Z" fill="#46B556" stroke="#27793A" stroke-width="2"/></g>`;
const slice = (c1, c2) => `<g transform="translate(152 60)"><circle r="19" fill="${c1}" stroke="${c2}" stroke-width="3"/><circle r="14" fill="${c2}" opacity=".35"/><path d="M0 -14 V14 M-14 0 H14 M-10 -10 L10 10 M10 -10 L-10 10" stroke="${c1}" stroke-width="2"/></g>`;
const wedge = `<g transform="translate(152 56) rotate(-20)"><path d="M-20 0 A20 20 0 0 0 20 0Z" fill="#E8412F" stroke="#59B34A" stroke-width="4" stroke-linejoin="round"/><path d="M-17 2 A17 17 0 0 0 17 2" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>${[[-8, 8], [0, 10], [8, 8]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.6" fill="#222"/>`).join("")}</g>`;
const spices = `<circle cx="118" cy="120" r="3" fill="#E8B866"/><circle cx="130" cy="140" r="3" fill="#E8B866"/><circle cx="108" cy="150" r="3" fill="#E8B866"/>`;
const can = (c1, c2) => frame("#D5ECFF", "#6FA8E8", `<defs><linearGradient id="cn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c2}"/><stop offset=".45" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="82" y="46" width="76" height="152" rx="12" fill="url(#cn)" stroke="#12203B" stroke-width="3"/><rect x="86" y="38" width="68" height="14" rx="6" fill="#C9D3DD" stroke="#12203B" stroke-width="3"/><rect x="86" y="190" width="68" height="12" rx="6" fill="#C9D3DD" stroke="#12203B" stroke-width="3"/><path d="M128 78 L104 124 H122 L112 166 L140 112 H122Z" fill="#FFE14A" stroke="#12203B" stroke-width="3" stroke-linejoin="round"/><rect x="92" y="56" width="10" height="132" rx="5" fill="#fff" opacity=".4"/>`);

const A = {
  "sandwich-chicken": sandwich("chicken"), "sandwich-paneer": sandwich("paneer"), "sandwich-veg": sandwich("veg"), "sandwich-corn": sandwich("corn"),
  "wrap-chicken": wrapArt("chicken"), "wrap-paneer": wrapArt("paneer"), "wrap-veg": wrapArt("veg"),
  "drink-virgin-mojito": glass({ bg: ["#E2FBE0", "#8FE3A0"], liquid: "#9EE08A", top: "#D4F5B8", garnish: mint + slice("#B8E986", "#6DBB3B"), bubbles: true }),
  "drink-green-apple-mojito": glass({ bg: ["#E0FFD8", "#79D98B"], liquid: "#52C23A", top: "#9FE070", garnish: mint + slice("#9BE05A", "#4FA32A"), bubbles: true }),
  "drink-blue-lemon-mojito": glass({ bg: ["#D9F0FF", "#6FB6F0"], liquid: "#2F8FE0", top: "#7CC8FF", garnish: mint + slice("#FFE14A", "#E0B800"), bubbles: true }),
  "drink-watermelon-mojito": glass({ bg: ["#FFE0E4", "#FF8FA0"], liquid: "#F2506A", top: "#FF93A5", garnish: mint + wedge, bubbles: true }),
  "drink-cola": glass({ bg: ["#FFE8D0", "#E39A5E"], liquid: "#3B1D12", top: "#6B3A22", garnish: slice("#FFE14A", "#E0B800"), straw: "#D62828" }),
  "drink-masala-cola": glass({ bg: ["#FFEAD6", "#F0A15F"], liquid: "#4A2417", top: "#7A4426", garnish: slice("#9BE05A", "#4FA32A") + spices, straw: "#D62828" }),
  "drink-sprite": glass({ bg: ["#E6FFE3", "#9ADFA3"], liquid: "#D7F3C8", top: "#F1FFE6", garnish: slice("#B8E986", "#6DBB3B"), bubbles: true, straw: "#2F8FE0" }),
  "drink-masala-sprite": glass({ bg: ["#EDFFE4", "#A9E5A8"], liquid: "#D9F2BE", top: "#F4FFE8", garnish: slice("#FFE14A", "#E0B800") + spices, bubbles: true, straw: "#2F8FE0" }),
  "drink-xtreme": can("#2F8FE0", "#1B5FA8"),
  "drink-green-apple-lemonade": glass({ bg: ["#F0FFD8", "#B7E77A"], liquid: "#A8DD3F", top: "#D9F58A", garnish: slice("#FFE14A", "#E0B800"), bubbles: true }),
  "drink-watermelon-lemonade": glass({ bg: ["#FFE6EA", "#FF9DAB"], liquid: "#F4627B", top: "#FFA3B2", garnish: slice("#FFE14A", "#E0B800"), bubbles: true, straw: "#2F8FE0" }),
  "drink-blue-lemonade": glass({ bg: ["#DDF2FF", "#78BDF2"], liquid: "#2D8FE6", top: "#86D0FF", garnish: slice("#FFE14A", "#E0B800"), bubbles: true }),
};

(async () => {
  const names = Object.keys(A);
  for (const n of names) await sharp(Buffer.from(A[n])).resize(240, 240).webp({ quality: 88 }).toFile(out + n + ".webp");
  const c = await Promise.all(names.map((n) => sharp(out + n + ".webp").resize(160, 160).toBuffer()));
  await sharp({ create: { width: 960, height: 160 * Math.ceil(names.length / 6), channels: 3, background: "#888" } })
    .composite(c.map((b, i) => ({ input: b, left: (i % 6) * 160, top: Math.floor(i / 6) * 160 }))).png().toFile("C:/tmp/art.png");
  console.log(names.length);
})();
