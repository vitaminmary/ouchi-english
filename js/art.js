// 絵はすべてSVGで描く（オリジナルの動物と、ピンク・パープルのキラキラの世界）

export const COLORS = {
  pink: '#FF8FC7', purple: '#B98BFF', blue: '#7EC8FF', yellow: '#FFE066',
  green: '#8EE3A1', white: '#FFFFFF', red: '#FF5A6E', orange: '#FFA552',
};

const INK = '#5a3d4f';

function eyes(lx, rx, y) {
  return `<g class="eyes">
    <ellipse cx="${lx}" cy="${y}" rx="8" ry="10" fill="${INK}"/><circle cx="${lx + 3}" cy="${y - 4}" r="3" fill="#fff"/>
    <ellipse cx="${rx}" cy="${y}" rx="8" ry="10" fill="${INK}"/><circle cx="${rx + 3}" cy="${y - 4}" r="3" fill="#fff"/>
  </g>`;
}

function mouth(y) {
  return `<path class="mouth-closed" d="M91 ${y} q4.5 6 9 0 q4.5 6 9 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <g class="mouth-open"><ellipse cx="100" cy="${y + 4}" rx="8" ry="9" fill="#c94f7c" stroke="${INK}" stroke-width="2.5"/><ellipse cx="100" cy="${y + 8}" rx="4.5" ry="3" fill="#ff9fbf"/></g>`;
}

function cheeks(y) {
  return `<ellipse cx="58" cy="${y}" rx="12" ry="7.5" fill="#FFAFC8" opacity=".85"/>
    <ellipse cx="142" cy="${y}" rx="12" ry="7.5" fill="#FFAFC8" opacity=".85"/>`;
}

function body(dress) {
  return `<g class="body">
    <path d="M58 228 Q54 170 100 162 Q146 170 142 228 Z" fill="${dress}" stroke="${INK}" stroke-width="3"/>
    <path d="M66 190 q34 14 68 0" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" opacity=".9"/>
    <ellipse class="arm arm-l" cx="56" cy="186" rx="13" ry="11" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <ellipse class="arm arm-r" cx="144" cy="186" rx="13" ry="11" fill="#fff" stroke="${INK}" stroke-width="3"/>
  </g>`;
}

const CHARACTERS = {
  mimi: () => `
    ${body('#FFB6D9')}
    <g class="head">
      <path d="M40 76 L50 16 L92 48 Z" fill="#FFF3E8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M53 62 L57 30 L80 48 Z" fill="#FFB6D2"/>
      <path d="M160 76 L150 16 L108 48 Z" fill="#FFF3E8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M147 62 L143 30 L120 48 Z" fill="#FFB6D2"/>
      <ellipse cx="100" cy="104" rx="72" ry="64" fill="#FFF3E8" stroke="${INK}" stroke-width="3"/>
      ${eyes(72, 128, 102)}
      ${cheeks(122)}
      <path d="M95 114 h10 l-5 5 Z" fill="#FF7FAF" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
      ${mouth(122)}
      <g stroke="${INK}" stroke-width="2.2" stroke-linecap="round"><path d="M34 112 l-20 -4"/><path d="M34 120 l-20 4"/><path d="M166 112 l20 -4"/><path d="M166 120 l20 4"/></g>
      <g transform="translate(140 40) rotate(18)">
        <path d="M0 0 L-22 -12 L-22 12 Z" fill="#FF5FA2" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M0 0 L22 -12 L22 12 Z" fill="#FF5FA2" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle r="6.5" fill="#FF8FC7" stroke="${INK}" stroke-width="2.5"/>
      </g>
    </g>`,
  bebe: () => `
    ${body('#D7C2FF')}
    <g class="head">
      <g transform="rotate(-10 72 52)"><ellipse cx="72" cy="28" rx="18" ry="46" fill="#fff" stroke="${INK}" stroke-width="3"/><ellipse cx="72" cy="32" rx="8" ry="32" fill="#FFC2D8"/></g>
      <g transform="rotate(10 128 52)"><ellipse cx="128" cy="28" rx="18" ry="46" fill="#fff" stroke="${INK}" stroke-width="3"/><ellipse cx="128" cy="32" rx="8" ry="32" fill="#FFC2D8"/></g>
      <ellipse cx="100" cy="108" rx="70" ry="60" fill="#fff" stroke="${INK}" stroke-width="3"/>
      ${eyes(74, 126, 104)}
      ${cheeks(124)}
      <ellipse cx="100" cy="116" rx="6" ry="4.5" fill="#FF7FAF" stroke="${INK}" stroke-width="1.5"/>
      ${mouth(123)}
      <g transform="translate(146 66) rotate(20)">
        <path d="M0 -12 C14 -12 16 6 0 18 C-16 6 -14 -12 0 -12Z" fill="#FF5A6E" stroke="${INK}" stroke-width="2.5"/>
        <path d="M-7 -12 L0 -18 L7 -12 L0 -9 Z" fill="#6ccf7e" stroke="${INK}" stroke-width="2"/>
        <g fill="#FFE9A8"><circle cx="-4" cy="-2" r="1.6"/><circle cx="4" cy="2" r="1.6"/><circle cx="-2" cy="7" r="1.6"/></g>
      </g>
    </g>`,
  popo: () => `
    ${body('#BFD9FF')}
    <g class="head">
      <circle cx="46" cy="50" r="22" fill="#33303a" stroke="${INK}" stroke-width="3"/>
      <circle cx="154" cy="50" r="22" fill="#33303a" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="100" cy="104" rx="72" ry="63" fill="#fff" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="71" cy="104" rx="16" ry="21" transform="rotate(25 71 104)" fill="#33303a"/>
      <ellipse cx="129" cy="104" rx="16" ry="21" transform="rotate(-25 129 104)" fill="#33303a"/>
      <g class="eyes"><circle cx="73" cy="102" r="6" fill="#fff"/><circle cx="127" cy="102" r="6" fill="#fff"/><circle cx="74" cy="103" r="3.2" fill="${INK}"/><circle cx="126" cy="103" r="3.2" fill="${INK}"/></g>
      ${cheeks(126)}
      <ellipse cx="100" cy="117" rx="7" ry="5" fill="#33303a"/>
      ${mouth(124)}
      <g transform="translate(66 50)">
        <g fill="#FFE066" stroke="${INK}" stroke-width="2">
          <circle cx="0" cy="-9" r="6"/><circle cx="8.5" cy="-3" r="6"/><circle cx="5.5" cy="7" r="6"/><circle cx="-5.5" cy="7" r="6"/><circle cx="-8.5" cy="-3" r="6"/>
        </g>
        <circle r="5" fill="#FF8FC7" stroke="${INK}" stroke-width="2"/>
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
  const cake = state === 'batter' ? '#FFE7A6' : '#E9AE6F';
  const cakeLine = state === 'batter' ? '#e9c56d' : '#b97a3f';
  const fr = color ? COLORS[color] || color : null;
  const frLine = fr ? shade(fr, -60) : INK;
  const frosting = fr ? `<g class="frosting">
      <path d="M26 114 Q24 86 58 86 L142 86 Q176 86 174 114 Q100 128 26 114Z" fill="${fr}" stroke="${frLine}" stroke-width="3"/>
      <path d="M44 90 Q44 62 76 62 L124 62 Q156 62 156 90 Q100 102 44 90Z" fill="${fr}" stroke="${frLine}" stroke-width="3"/>
      <path d="M66 66 Q68 38 100 26 Q132 38 134 66 Q100 76 66 66Z" fill="${fr}" stroke="${frLine}" stroke-width="3"/>
      <path d="M52 100 q20 -8 40 -6 M60 76 q14 -6 28 -5 M84 52 q6 -10 14 -14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>
    </g>` : '';
  return `<svg class="cupcake-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <path d="M36 112 Q36 ${state === 'batter' ? 96 : 70} 100 ${state === 'batter' ? 92 : 66} Q164 ${state === 'batter' ? 96 : 70} 164 112 Z" fill="${cake}" stroke="${cakeLine}" stroke-width="3"/>
    ${frosting}
    <path d="M34 112 L166 112 L150 186 L50 186 Z" fill="#FFC4DE" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <g stroke="#FF94C4" stroke-width="5" stroke-linecap="round"><path d="M58 118 L66 180"/><path d="M83 118 L87 180"/><path d="M108 118 L108 180"/><path d="M133 118 L129 180"/><path d="M156 118 L148 180" opacity=".7"/></g>
  </svg>`;
}

// ---- ボウル・オーブン・材料 ----
export function bowlSVG() {
  return `<svg class="bowl-svg" viewBox="0 0 240 170" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 56 Q18 162 120 162 Q222 162 232 56 Z" fill="#CFE9FF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M30 86 Q48 140 112 146" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>
    <g class="bowl-hearts" fill="#FF9CC9"><path d="M170 112 c-6-8 6-14 8-5 c2-9 14-3 8 5 l-8 8 Z"/><path d="M196 92 c-4-6 4-10 6-4 c2-6 10-2 6 4 l-6 6 Z"/></g>
    <ellipse cx="120" cy="56" rx="112" ry="20" fill="#E8F5FF" stroke="${INK}" stroke-width="3.5"/>
    <g class="batter-wrap"><ellipse class="batter" cx="120" cy="60" rx="98" ry="14" fill="#FFE7A6"/>
      <path class="swirl" d="M120 60 m-40 0 a40 9 0 1 0 80 0 a28 6 0 1 0 -56 0" fill="none" stroke="#f2c86a" stroke-width="4" stroke-linecap="round"/></g>
  </svg>`;
}

export function ovenSVG() {
  return `<svg class="oven-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="22" width="176" height="166" rx="26" fill="#FFD1E6" stroke="${INK}" stroke-width="3.5"/>
    <rect x="12" y="22" width="176" height="40" rx="20" fill="#F7B3D6" stroke="${INK}" stroke-width="3.5"/>
    <circle cx="46" cy="42" r="10" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="80" cy="42" r="10" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <rect x="118" y="34" width="52" height="16" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <rect class="oven-window" x="34" y="78" width="132" height="86" rx="18" fill="#6b4a63" stroke="${INK}" stroke-width="3.5"/>
    <path d="M48 92 q20 -6 40 0" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35" fill="none"/>
    <rect x="58" y="172" width="84" height="8" rx="4" fill="${INK}" opacity=".5"/>
  </svg>`;
}

const SUGAR = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 30 L78 30 L84 92 L16 92 Z" fill="#BFE3FF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M22 30 L30 14 L70 14 L78 30" fill="#E8F5FF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <g fill="#fff" stroke="${INK}" stroke-width="2.5"><rect x="30" y="50" width="16" height="16" rx="3"/><rect x="52" y="48" width="16" height="16" rx="3"/><rect x="41" y="66" width="16" height="16" rx="3"/></g>
  <path d="M74 18 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" fill="#FFE066"/>
</svg>`;

const SPRINKLES = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g stroke-width="11" stroke-linecap="round">
    <path d="M22 30 l14 -8" stroke="#FF8FC7"/><path d="M58 22 l12 10" stroke="#7EC8FF"/><path d="M30 62 l16 4" stroke="#FFE066"/>
    <path d="M66 58 l8 -14" stroke="#B98BFF"/><path d="M48 44 l2 14" stroke="#8EE3A1"/><path d="M60 80 l14 -4" stroke="#FFA552"/><path d="M24 84 l10 -10" stroke="#B98BFF"/>
  </g>
</svg>`;

// 材料・トッピングの見た目（キーは JSON の単語）
export const ITEMS = {
  eggs: '<span class="emo">🥚</span>',
  milk: '<span class="emo">🥛</span>',
  sugar: SUGAR,
  chocolate: '<span class="emo">🍫</span>',
  hearts: '<span class="emo">💗</span>',
  stars: '<span class="emo">⭐</span>',
  strawberries: '<span class="emo">🍓</span>',
  sprinkles: SPRINKLES,
  candles: '<span class="emo">🕯️</span>',
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
