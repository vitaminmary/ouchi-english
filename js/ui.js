// 画面の部品: ドラッグ、大きな数字、キラキラ、録音の表示、長押しボタン
import { ICONS } from './art.js';

export const $ = sel => document.querySelector(sel);
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function centerOf(node) {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function hit(rect, x, y, pad = 30) {
  return x > rect.left - pad && x < rect.right + pad && y > rect.top - pad && y < rect.bottom + pad;
}

// 指で運ぶ。タップだけでも運べる（3歳でもできるように）
// onDrop(point, viaTap) が false を返したら元の場所にもどる
export function makeDraggable(node, { target, onDrop, ghostClass = '' }) {
  node.classList.add('draggable');
  node.addEventListener('pointerdown', e => {
    if (node.classList.contains('used')) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    const r = node.getBoundingClientRect();
    const ghost = node.cloneNode(true);
    ghost.classList.remove('draggable', 'lifting', 'glow', 'drop-hover');
    ghost.classList.add('ghost');
    if (ghostClass) ghost.classList.add(ghostClass);
    ghost.style.width = r.width + 'px';
    ghost.style.height = r.height + 'px';
    ghost.style.left = r.left + 'px';
    ghost.style.top = r.top + 'px';
    document.body.appendChild(ghost);
    node.classList.add('lifting');
    let moved = false;

    const move = ev => {
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (Math.hypot(dx, dy) > 12) moved = true;
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
      const t = typeof target === 'function' ? target() : target;
      t?.classList.toggle('drop-hover', hit(t.getBoundingClientRect(), ev.clientX, ev.clientY));
    };
    const up = async ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      node.classList.remove('lifting');
      const t = typeof target === 'function' ? target() : target;
      t?.classList.remove('drop-hover');
      const tr = t.getBoundingClientRect();
      let point;
      if (!moved) {
        // タップ: 的の上へふわっと飛ぶ
        point = { x: tr.left + tr.width * (0.3 + Math.random() * 0.4), y: tr.top + tr.height * (0.3 + Math.random() * 0.3) };
        ghost.style.transition = 'transform .45s cubic-bezier(.3,1.4,.6,1)';
        ghost.style.transform = `translate(${point.x - (r.left + r.width / 2)}px, ${point.y - (r.top + r.height / 2)}px) scale(1.1)`;
        await sleep(430);
      } else if (hit(tr, ev.clientX, ev.clientY)) {
        point = { x: ev.clientX, y: ev.clientY };
      }
      const ok = point ? await onDrop(point, !moved) : false;
      if (ok === false) {
        ghost.style.transition = 'transform .4s ease';
        ghost.style.transform = 'translate(0,0) scale(1)';
        await sleep(400);
      }
      ghost.remove();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
}

export function bigNumber(n) {
  const o = $('#overlay');
  const node = el(`<div class="big-number">${n}</div>`);
  o.appendChild(node);
  setTimeout(() => node.remove(), 1100);
}

export function burst(x, y, count = 10) {
  const o = document.body;
  const glyphs = ['✦', '✧', '♥', '✦'];
  for (let i = 0; i < count; i++) {
    const s = el(`<span class="burst">${glyphs[i % glyphs.length]}</span>`);
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const d = 50 + Math.random() * 60;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--dx', Math.cos(a) * d + 'px');
    s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    s.style.color = ['#FF8FC7', '#B98BFF', '#FFE066', '#7EC8FF'][i % 4];
    o.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

// 録音中・再生中の表示（文字なし。マイクと声の輪で見せる）
export function recorderUI() {
  const node = el(`<div class="recorder">
    <div class="rec-circle"><span class="rec-ring"></span><span class="rec-ring r2"></span><span class="rec-icon">${ICONS.mic}</span></div>
    <div class="rec-dots"><i></i><i></i><i></i></div>
  </div>`);
  $('#overlay').appendChild(node);
  const ring = node.querySelector('.rec-ring');
  return {
    start(ms) {
      node.classList.add('recording');
      node.querySelectorAll('.rec-dots i').forEach((d, i) => setTimeout(() => d.classList.add('on'), (ms / 3) * i + 200));
    },
    level(v) { ring.style.transform = `scale(${1 + v * 0.9})`; },
    playing() {
      node.classList.remove('recording');
      node.classList.add('playing');
      node.querySelector('.rec-icon').innerHTML = ICONS.speaker;
    },
    hide() { node.classList.add('out'); setTimeout(() => node.remove(), 300); },
  };
}

// 長押しで反応するボタン（子どもがうっかり押しても動かない）
export function holdButton(node, ms, cb) {
  let timer = 0;
  const cancel = () => { clearTimeout(timer); node.classList.remove('holding'); };
  node.style.setProperty('--hold', ms + 'ms');
  node.addEventListener('pointerdown', e => {
    e.preventDefault();
    node.classList.add('holding');
    timer = setTimeout(() => { cancel(); cb(); }, ms);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => node.addEventListener(t, cancel));
  node.addEventListener('contextmenu', e => e.preventDefault());
}

export function show(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === screenId));
}

export function makeSparkles() {
  const host = $('#sparkles');
  for (let i = 0; i < 22; i++) {
    const s = el(`<span>${i % 3 ? '✦' : '♥'}</span>`);
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
    s.style.fontSize = (10 + Math.random() * 16).toFixed(0) + 'px';
    host.appendChild(s);
  }
}
