// 絵はすべてSVGで描く（オリジナルの動物と、ピンク・パープルのフラットでポップな世界）

export const COLORS = {
  pink: '#FF6FB5', purple: '#9B6BFF', blue: '#4FB3FF', yellow: '#FFD23F',
  green: '#3DD07A', white: '#FFFFFF', red: '#FF3B5C', orange: '#FF8A3D',
};

// フラットでポップな絵: 線は使わず、丸・三角・角丸の形と、はっきりした色で描く
const DARK = '#3B2347';

function eyes(lx, rx, y, r = 17, ring = null) {
  // ring: 白い顔でも白目が見えるように付ける縁の色
  const eye = x => `${ring ? `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="${ring}"/>` : ''}<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>
    <circle cx="${x + r * 0.15}" cy="${y + r * 0.08}" r="${r * 0.5}" fill="${DARK}"/>
    <circle cx="${x + r * 0.32}" cy="${y - r * 0.18}" r="${r * 0.16}" fill="#fff"/>`;
  return `<g class="eyes">${eye(lx)}${eye(rx)}</g>`;
}

function mouth(y, { teeth = false } = {}) {
  return `<path class="mouth-closed" d="M89 ${y} q5.5 7 11 0 q5.5 7 11 0" fill="none" stroke="${DARK}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    <g class="mouth-open">
      <path d="M86 ${y - 3} h28 a14 14 0 0 1 -28 0 z" fill="#7A1F45"/>
      <ellipse cx="100" cy="${y + 7}" rx="8" ry="4.5" fill="#FF6F91"/>
      ${teeth ? `<rect x="93" y="${y - 3}" width="6" height="7" rx="1.5" fill="#fff"/><rect x="101" y="${y - 3}" width="6" height="7" rx="1.5" fill="#fff"/>` : ''}
    </g>`;
}

function cheeks(y, color = '#FF5E9C') {
  return `<circle cx="50" cy="${y}" r="10" fill="${color}" opacity=".45"/><circle cx="150" cy="${y}" r="10" fill="${color}" opacity=".45"/>`;
}

// 体: ワンピース・腕・足（腕は .arm でダンスに使う）
function body({ dress, skin, legs = skin, arms = skin }) {
  return `<g class="body">
    <rect x="70" y="200" width="18" height="28" rx="8" fill="${legs}"/>
    <rect x="112" y="200" width="18" height="28" rx="8" fill="${legs}"/>
    <g transform="rotate(20 50 184)"><ellipse class="arm arm-l" cx="50" cy="184" rx="11" ry="20" fill="${arms}"/></g>
    <g transform="rotate(-20 150 184)"><ellipse class="arm arm-r" cx="150" cy="184" rx="11" ry="20" fill="${arms}"/></g>
    <path d="M70 156 L130 156 L148 212 Q100 222 52 212 Z" fill="${dress}"/>
  </g>`;
}

const CHARACTERS = {
  // 猫のMimi: おしゃれでピンクが好き
  mimi: () => `
    ${body({ dress: '#8E5CF7', skin: '#FF9CCB' })}
    <g class="head">
      <path d="M40 84 L52 12 L100 56 Z" fill="#FF9CCB"/>
      <path d="M54 66 L60 32 L84 56 Z" fill="#FF5FA8"/>
      <path d="M160 84 L148 12 L100 56 Z" fill="#FF9CCB"/>
      <path d="M146 66 L140 32 L116 56 Z" fill="#FF5FA8"/>
      <rect x="30" y="44" width="140" height="118" rx="52" fill="#FF9CCB"/>
      <ellipse cx="100" cy="132" rx="32" ry="22" fill="#FFE1EF"/>
      ${eyes(70, 130, 100)}
      ${cheeks(128)}
      <path d="M93 116 h14 l-7 8 z" fill="#C2185B" stroke="#C2185B" stroke-width="3" stroke-linejoin="round"/>
      ${mouth(130)}
      <g stroke="${DARK}" stroke-width="3.5" stroke-linecap="round"><path d="M28 120 h-16"/><path d="M30 132 l-15 5"/><path d="M172 120 h16"/><path d="M170 132 l15 5"/></g>
      <g transform="translate(140 46) rotate(15)">
        <path d="M0 0 L-24 -14 L-24 14 Z" fill="#8E5CF7"/>
        <path d="M0 0 L24 -14 L24 14 Z" fill="#8E5CF7"/>
        <circle r="7.5" fill="#B48BFF"/>
      </g>
    </g>`,
  // うさぎのBebe: 甘いものが好き・いつも元気
  bebe: () => `
    ${body({ dress: '#FFC93C', skin: '#FFFFFF' })}
    <g class="head">
      <rect x="54" y="-8" width="32" height="88" rx="16" fill="#fff" transform="rotate(-8 70 70)"/>
      <rect x="62" y="6" width="16" height="60" rx="8" fill="#FFB3D1" transform="rotate(-8 70 70)"/>
      <rect x="114" y="-8" width="32" height="88" rx="16" fill="#fff" transform="rotate(8 130 70)"/>
      <rect x="122" y="6" width="16" height="60" rx="8" fill="#FFB3D1" transform="rotate(8 130 70)"/>
      <rect x="34" y="56" width="132" height="108" rx="54" fill="#fff"/>
      ${eyes(74, 126, 104, 16, '#EADCFB')}
      ${cheeks(130)}
      <ellipse cx="100" cy="122" rx="7" ry="5" fill="#FF5FA8"/>
      ${mouth(134, { teeth: true })}
      <g transform="translate(140 62) rotate(18)">
        <path d="M0 -12 C15 -12 17 6 0 19 C-17 6 -15 -12 0 -12Z" fill="#FF4D6D"/>
        <path d="M-8 -12 L0 -19 L8 -12 L0 -8 Z" fill="#2EC46B"/>
        <g fill="#FFE07A"><circle cx="-4" cy="-2" r="1.8"/><circle cx="4" cy="2" r="1.8"/><circle cx="-2" cy="8" r="1.8"/></g>
      </g>
    </g>`,
  // パンダのPopo: のんびり・ダンスが好き
  popo: () => `
    <g class="body">
      <rect x="70" y="200" width="20" height="28" rx="9" fill="#2B2233"/>
      <rect x="110" y="200" width="20" height="28" rx="9" fill="#2B2233"/>
      <g transform="rotate(22 52 182)"><ellipse class="arm arm-l" cx="52" cy="182" rx="12" ry="21" fill="#2B2233"/></g>
      <g transform="rotate(-22 148 182)"><ellipse class="arm arm-r" cx="148" cy="182" rx="12" ry="21" fill="#2B2233"/></g>
      <ellipse cx="100" cy="186" rx="48" ry="36" fill="#fff"/>
      <ellipse cx="100" cy="194" rx="26" ry="20" fill="#E9E2F5"/>
      <g transform="translate(100 156)"><path d="M0 0 L-16 -9 L-16 9 Z" fill="#2EC4B6"/><path d="M0 0 L16 -9 L16 9 Z" fill="#2EC4B6"/><circle r="5" fill="#7FE3D9"/></g>
    </g>
    <g class="head">
      <circle cx="46" cy="52" r="24" fill="#2B2233"/>
      <circle cx="154" cy="52" r="24" fill="#2B2233"/>
      <circle cx="100" cy="102" r="66" fill="#fff"/>
      <ellipse cx="70" cy="104" rx="21" ry="25" fill="#2B2233" transform="rotate(22 70 104)"/>
      <ellipse cx="130" cy="104" rx="21" ry="25" fill="#2B2233" transform="rotate(-22 130 104)"/>
      ${eyes(72, 128, 102, 11)}
      ${cheeks(132)}
      <ellipse cx="100" cy="126" rx="9" ry="6" fill="#2B2233"/>
      ${mouth(136)}
      <g transform="translate(64 46)">
        <g fill="#FFC93C"><circle cx="0" cy="-10" r="7"/><circle cx="9.5" cy="-3" r="7"/><circle cx="6" cy="8" r="7"/><circle cx="-6" cy="8" r="7"/><circle cx="-9.5" cy="-3" r="7"/></g>
        <circle r="5.5" fill="#FF5FA8"/>
      </g>
    </g>`,
};

export function characterSVG(id) {
  return `<svg class="char-svg char-${id}" viewBox="0 -10 200 240" xmlns="http://www.w3.org/2000/svg">${CHARACTERS[id]()}</svg>`;
}

// ---- カップケーキ ----
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v + amt))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

export function cupcakeSVG({ state = 'baked', color = null } = {}) {
  // state: 'batter'（焼く前） | 'baked'
  const cake = state === 'batter' ? '#FFE08A' : '#F0A35E';
  const top = state === 'batter' ? 94 : 68;
  const fr = color ? COLORS[color] || color : null;
  // 白いクリームも背景から見えるように、影の色を少し濃くする
  const frShade = fr ? shade(fr, color === 'white' ? -45 : -40) : null;
  const tier = (d, dy = 0) => `<path d="${d}" transform="translate(0 ${dy})"/>`;
  const tiers = [
    'M24 116 Q22 86 58 86 L142 86 Q178 86 176 116 Q100 130 24 116Z',
    'M44 90 Q44 62 76 62 L124 62 Q156 62 156 90 Q100 102 44 90Z',
    'M66 66 Q68 38 100 24 Q132 38 134 66 Q100 76 66 66Z',
  ];
  const frosting = fr ? `<g class="frosting">
      <g fill="${frShade}">${tiers.map(d => tier(d, 5)).join('')}</g>
      <g fill="${fr}">${tiers.map(d => tier(d)).join('')}</g>
      <path d="M52 100 q20 -8 40 -6 M62 76 q14 -6 28 -5 M86 50 q6 -10 14 -14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    </g>` : '';
  return `<svg class="cupcake-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <path d="M36 114 Q36 ${top + 2} 100 ${top} Q164 ${top + 2} 164 114 Z" fill="${cake}"/>
    ${frosting}
    <path d="M34 112 L166 112 L150 188 L50 188 Z" fill="#FF5FA8"/>
    <g fill="#FF8FC4"><path d="M52 112 h14 l4 76 h-12 Z"/><path d="M82 112 h14 l0 76 h-12 Z"/><path d="M112 112 h14 l-3 76 h-12 Z"/><path d="M142 112 h14 l-8 76 h-10 Z"/></g>
  </svg>`;
}

// ---- ボウル・オーブン・材料 ----
export function bowlSVG() {
  return `<svg class="bowl-svg" viewBox="0 0 240 170" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 56 Q18 164 120 164 Q222 164 232 56 Z" fill="#5BB8FF"/>
    <path d="M28 84 Q44 138 108 148" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".45"/>
    <g fill="#fff" opacity=".9"><path d="M170 112 c-6-8 6-14 8-5 c2-9 14-3 8 5 l-8 8 Z"/><path d="M196 92 c-4-6 4-10 6-4 c2-6 10-2 6 4 l-6 6 Z"/></g>
    <ellipse cx="120" cy="56" rx="112" ry="20" fill="#9AD5FF"/>
    <ellipse cx="120" cy="58" rx="98" ry="14" fill="#3E9BE6"/>
    <g class="batter-wrap"><ellipse class="batter" cx="120" cy="60" rx="98" ry="14" fill="#FFE08A"/>
      <path class="swirl" d="M120 60 m-40 0 a40 9 0 1 0 80 0 a28 6 0 1 0 -56 0" fill="none" stroke="#F5C04E" stroke-width="5" stroke-linecap="round"/></g>
  </svg>`;
}

export function ovenSVG() {
  return `<svg class="oven-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="22" width="176" height="166" rx="28" fill="#FF6FAE"/>
    <rect x="12" y="22" width="176" height="44" rx="22" fill="#E0408C"/>
    <rect x="12" y="44" width="176" height="22" fill="#E0408C"/>
    <circle cx="46" cy="44" r="11" fill="#fff"/><circle cx="80" cy="44" r="11" fill="#FFC93C"/>
    <rect x="118" y="36" width="52" height="16" rx="8" fill="#fff"/>
    <rect class="oven-window" x="32" y="80" width="136" height="86" rx="20" fill="#4A2B5E"/>
    <path d="M48 96 q20 -6 40 0" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".35" fill="none"/>
    <rect x="58" y="174" width="84" height="8" rx="4" fill="#fff" opacity=".8"/>
  </svg>`;
}

const SUGAR = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 30 L80 30 L86 94 L14 94 Z" fill="#5BB8FF"/>
  <path d="M20 30 L30 12 L70 12 L80 30 Z" fill="#9AD5FF"/>
  <g fill="#fff"><rect x="28" y="50" width="18" height="18" rx="4"/><rect x="52" y="46" width="18" height="18" rx="4"/><rect x="40" y="68" width="18" height="18" rx="4"/></g>
  <path d="M74 14 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFC93C"/>
</svg>`;

const SPRINKLES = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g stroke-width="12" stroke-linecap="round">
    <path d="M22 30 l14 -8" stroke="#FF5FA8"/><path d="M58 22 l12 10" stroke="#5BB8FF"/><path d="M30 62 l16 4" stroke="#FFC93C"/>
    <path d="M66 58 l8 -14" stroke="#8E5CF7"/><path d="M48 44 l2 14" stroke="#2EC46B"/><path d="M60 80 l14 -4" stroke="#FF8A3D"/><path d="M24 84 l10 -10" stroke="#8E5CF7"/>
  </g>
</svg>`;

const svg = body => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

const EGG = svg(`<ellipse cx="50" cy="56" rx="30" ry="38" fill="#FFD49A"/><ellipse cx="40" cy="40" rx="8" ry="12" fill="#FFF6E6"/>`);
const MILK = svg(`<path d="M28 34 L50 14 L72 34 Z" fill="#FF6FB5"/><rect x="28" y="32" width="44" height="58" rx="6" fill="#5BB8FF"/>
  <rect x="34" y="46" width="32" height="30" rx="6" fill="#fff"/><path d="M50 52 c-6 8 -7 12 -7 14 a7 7 0 0 0 14 0 c0 -2 -1 -6 -7 -14z" fill="#5BB8FF"/>`);
const CHOCOLATE = svg(`<rect x="22" y="14" width="56" height="74" rx="8" fill="#7A4524"/>
  <g fill="#94592F"><rect x="28" y="20" width="20" height="18" rx="3"/><rect x="52" y="20" width="20" height="18" rx="3"/><rect x="28" y="42" width="20" height="18" rx="3"/><rect x="52" y="42" width="20" height="18" rx="3"/></g>
  <path d="M22 62 h56 v18 a8 8 0 0 1 -8 8 h-40 a8 8 0 0 1 -8 -8 z" fill="#FF6FB5"/><path d="M22 62 l10 8 l10 -8 l10 8 l10 -8 l10 8 l6 -5 v-3 z" fill="#FF6FB5"/>`);
const HEART = svg(`<path d="M50 88 C18 64 10 46 14 32 C19 16 40 12 50 30 C60 12 81 16 86 32 C90 46 82 64 50 88Z" fill="#FF4D94"/><ellipse cx="32" cy="34" rx="7" ry="5" fill="#fff" opacity=".55" transform="rotate(-30 32 34)"/>`);
const STAR = svg(`<path d="M50 8 L61 36 L91 38 L68 57 L76 87 L50 70 L24 87 L32 57 L9 38 L39 36 Z" fill="#FFC93C" stroke="#FFC93C" stroke-width="6" stroke-linejoin="round"/>`);
const STRAWBERRY = svg(`<path d="M50 92 C22 74 14 52 22 38 C30 26 70 26 78 38 C86 52 78 74 50 92Z" fill="#FF3B5C"/>
  <path d="M30 30 L40 20 L50 28 L60 20 L70 30 L58 34 L50 30 L42 34 Z" fill="#2EC46B"/><rect x="47" y="10" width="6" height="14" rx="3" fill="#2EC46B"/>
  <g fill="#FFE07A"><circle cx="38" cy="46" r="2.8"/><circle cx="54" cy="44" r="2.8"/><circle cx="66" cy="52" r="2.8"/><circle cx="44" cy="60" r="2.8"/><circle cx="58" cy="64" r="2.8"/><circle cx="50" cy="76" r="2.8"/></g>`);
const CANDLE = svg(`<rect x="40" y="38" width="20" height="54" rx="5" fill="#E6D6FF"/>
  <g fill="#FF6FB5"><path d="M40 46 L60 38 V48 L40 56 Z"/><path d="M40 64 L60 56 V66 L40 74 Z"/><path d="M40 82 L60 74 V84 L40 92 Z"/></g>
  <rect x="48" y="28" width="4" height="12" rx="2" fill="#3B2347"/><path d="M50 4 C60 16 60 26 50 30 C40 26 40 16 50 4Z" fill="#FF8A3D"/><path d="M50 14 C55 20 55 25 50 27 C45 25 45 20 50 14Z" fill="#FFD23F"/>`);

// 材料・トッピングの見た目（キーは JSON の単語）。絵文字は端末で見た目が変わるので使わない
export const ITEMS = {
  eggs: EGG,
  milk: MILK,
  sugar: SUGAR,
  chocolate: CHOCOLATE,
  hearts: HEART,
  stars: STAR,
  strawberries: STRAWBERRY,
  sprinkles: SPRINKLES,
  candles: CANDLE,
};

export const ICONS = {
  mic: `<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11Z"/></svg>`,
  speaker: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4ZM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6Z"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4Z"/></svg>`,
  home: `<svg viewBox="0 0 24 24"><path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3Z"/></svg>`,
};

export function starBurstSVG() {
  return `<svg viewBox="0 0 100 100"><path d="M50 4 L60 38 L96 38 L67 59 L78 94 L50 72 L22 94 L33 59 L4 38 L40 38 Z" fill="#FFE066" stroke="#F5B700" stroke-width="3" stroke-linejoin="round"/></svg>`;
}
