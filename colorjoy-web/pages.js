/* 8 hand-authored SVG coloring pages.
   Every <element class="region"> is fillable by click. */
const PAGES = [
  {
    id: "butterfly",
    title: "Butterfly",
    emoji: "🦋",
    svg: `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <ellipse class="region" cx="93" cy="115" rx="72" ry="58"/>
      <ellipse class="region" cx="207" cy="115" rx="72" ry="58"/>
      <circle class="region" cx="98" cy="185" r="38"/>
      <circle class="region" cx="202" cy="185" r="38"/>
      <ellipse class="region" cx="150" cy="165" rx="20" ry="72"/>
      <circle class="region" cx="150" cy="82" r="18"/>
      <circle class="region" cx="86" cy="110" r="24"/>
      <circle class="region" cx="214" cy="110" r="24"/>
      <circle class="region" cx="150" cy="120" r="12"/>
      <path class="region" d="M144 66 Q130 44 116 38 Q132 40 148 54 Z"/>
      <path class="region" d="M156 66 Q170 44 184 38 Q168 40 152 54 Z"/>
    </svg>`,
  },
  {
    id: "flower",
    title: "Flower",
    emoji: "🌸",
    svg: `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <circle class="region" cx="150" cy="102" r="26"/>
      <ellipse class="region" cx="150" cy="66" rx="24" ry="30"/>
      <ellipse class="region" cx="185" cy="90" rx="30" ry="24"/>
      <ellipse class="region" cx="186" cy="130" rx="26" ry="22"/>
      <ellipse class="region" cx="150" cy="140" rx="24" ry="28"/>
      <ellipse class="region" cx="114" cy="130" rx="26" ry="22"/>
      <ellipse class="region" cx="115" cy="90" rx="30" ry="24"/>
      <path class="region" d="M146 168 Q142 236 138 268 Q154 250 152 168 Z"/>
      <ellipse class="region" cx="118" cy="222" rx="34" ry="12"/>
      <circle class="region" cx="150" cy="102" r="12"/>
    </svg>`,
  },
  {
    id: "house",
    title: "House",
    emoji: "🏠",
    svg: `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect class="region" x="70" y="140" width="160" height="112"/>
      <path class="region" d="M52 140 L150 62 L248 140 Z"/>
      <rect class="region" x="128" y="186" width="44" height="66"/>
      <rect class="region" x="88" y="160" width="30" height="30"/>
      <rect class="region" x="182" y="160" width="30" height="30"/>
      <rect class="region" x="196" y="72" width="20" height="42"/>
      <polygon class="region" points="168,96 184,104 166,112"/>
      <ellipse class="region" cx="235" cy="66" rx="16" ry="9"/>
    </svg>`,
  },
  {
    id: "fish",
    title: "Fish",
    emoji: "🐠",
    svg: `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <ellipse class="region" cx="140" cy="150" rx="88" ry="55"/>
      <polygon class="region" points="228,150 276,112 276,188"/>
      <path class="region" d="M120 95 Q150 62 180 95 Z"/>
      <path class="region" d="M120 205 Q150 238 180 205 Z"/>
      <circle class="region" cx="102" cy="138" r="11"/>
      <path class="region" d="M188 150 Q206 162 188 176 Q204 162 188 150 Z"/>
      <ellipse class="region" cx="150" cy="150" rx="30" ry="18"/>
      <path class="region" d="M60 150 q12 -12 24 0 q-12 12 -24 0 Z"/>
      <circle class="region" cx="210" cy="70" r="7"/>
      <circle class="region" cx="228" cy="88" r="5"/>
    </svg>`,
  },
  {
    id: "car",
    title: "Car",
    emoji: "🚗",
    svg: `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <path class="region" d="M52 190 Q50 158 84 154 L104 118 Q112 104 130 104 L182 104 Q200 104 208 120 L222 154 Q250 160 248 190 L246 204 L54 204 Z"/>
      <rect class="region" x="118" y="116" width="28" height="36"/>
      <rect class="region" x="154" y="116" width="28" height="36"/>
      <circle class="region" cx="102" cy="204" r="24"/>
      <circle class="region" cx="198" cy="204" r="24"/>
      <circle class="region" cx="102" cy="204" r="9"/>
      <circle class="region" cx="198" cy="204" r="9"/>
      <rect class="region" x="246" y="172" width="16" height="10"/>
    </svg>`,
  },
  {
    id: "tree",
    title: "Tree",
    emoji: "🌳",
    svg: `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <circle class="region" cx="150" cy="106" r="52"/>
      <circle class="region" cx="100" cy="132" r="38"/>
      <circle class="region" cx="200" cy="132" r="38"/>
      <rect class="region" x="138" y="160" width="24" height="100"/>
      <path class="region" d="M138 208 Q100 214 88 196 Q118 196 138 202 Z"/>
      <path class="region" d="M162 196 Q200 204 212 188 Q182 188 162 192 Z"/>
      <ellipse class="region" cx="72" cy="258" rx="40" ry="9"/>
      <rect class="region" x="180" y="246" width="24" height="16"/>
    </svg>`,
  },
  {
    id: "cat",
    title: "Cat",
    emoji: "🐱",
    svg: `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <circle class="region" cx="150" cy="130" r="72"/>
      <polygon class="region" points="96,84 88,36 134,66"/>
      <polygon class="region" points="204,84 212,36 166,66"/>
      <polygon class="region" points="112,74 108,50 132,66"/>
      <polygon class="region" points="188,74 192,50 168,66"/>
      <ellipse class="region" cx="122" cy="120" rx="15" ry="18"/>
      <ellipse class="region" cx="178" cy="120" rx="15" ry="18"/>
      <path class="region" d="M136 156 Q150 168 164 156 Q150 176 136 156 Z"/>
      <path class="region" d="M60 128 L110 128 M60 142 L110 138" stroke-linecap="round"/>
      <path class="region" d="M240 128 L190 128 M240 142 L190 138"/>
      <ellipse class="region" cx="150" cy="146" rx="7" ry="5"/>
    </svg>`,
  },
  {
    id: "rocket",
    title: "Rocket",
    emoji: "🚀",
    svg: `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <path class="region" d="M150 42 Q186 84 186 150 L114 150 Q114 84 150 42 Z"/>
      <circle class="region" cx="150" cy="112" r="18"/>
      <rect class="region" x="114" y="150" width="72" height="26"/>
      <path class="region" d="M114 132 Q84 142 84 176 L114 168 Z"/>
      <path class="region" d="M186 132 Q216 142 216 176 L186 168 Z"/>
      <rect class="region" x="132" y="176" width="36" height="16"/>
      <path class="region" d="M150 192 Q168 226 150 256 Q132 226 150 192 Z"/>
      <path class="region" d="M150 246 Q160 266 150 282 Q140 266 150 246 Z"/>
      <circle class="region" cx="66" cy="80" r="6"/>
      <circle class="region" cx="238" cy="60" r="8"/>
      <circle class="region" cx="252" cy="110" r="5"/>
    </svg>`,
  },
];
