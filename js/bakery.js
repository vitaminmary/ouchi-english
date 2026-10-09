// コーナー01 お菓子作り（カップケーキ）
// セリフ・単語はすべて data/01_bakery.json から読む。ここで英語の文を作らない。
import { speak, sfx, record, playBlob, releaseMic } from './audio.js';
import { el, sleep, makeDraggable, bigNumber, burst, recorderUI, centerOf } from './ui.js';
import { cupcakeSVG, bowlSVG, ovenSVG, ITEMS, COLORS, ICONS } from './art.js';
import * as store from './store.js';

import { NUM, words, isQuestion, sentences, firstNumber, countWord, fillTemplate, bakeCue, bakeLine, isGiveLine } from './text.js';
const ALIASES = {
  eggs: ['eggs', 'egg'], milk: ['milk'], sugar: ['sugar'], chocolate: ['chocolate'],
  hearts: ['hearts', 'heart'], stars: ['stars', 'star'], strawberries: ['strawberries', 'strawberry'],
  sprinkles: ['sprinkles'], candles: ['candles', 'candle'],
};

const pick = a => a[Math.floor(Math.random() * a.length)];

// 「Put in two eggs and the milk.」→ { eggs: 2, milk: 1 }
function parseNeeds(line, keys) {
  const ws = words(line);
  const needs = {};
  ws.forEach((w, i) => {
    for (const k of keys) {
      if ((ALIASES[k] || [k]).includes(w)) needs[k] = (needs[k] || 0) + (NUM[ws[i - 1]] || 1);
    }
  });
  return needs;
}

class Abort extends Error {}

function vocab(ctx, group) {
  const v = ctx.data.vocabulary;
  const list = [...(v.step1[group] || [])];
  if (ctx.stepN >= 2) list.push(...(v.step2_add?.[group] || []));
  return list;
}

function fill(text, ctx) {
  return fillTemplate(text, { color: ctx.color || 'pink', orderColor: ctx.orderColor || 'pink', name: ctx.char.name });
}

function linesOf(ctx, scene) {
  return (scene.lines?.[ctx.step] || []).map(l => fill(l, ctx));
}

function sayOf(ctx, scene) {
  const s = scene.say?.[ctx.step];
  return s ? fill(s, ctx) : null;
}

// ---------- 共通の流れ ----------

function happy(ctx) {
  ctx.charEl.classList.remove('jump');
  void ctx.charEl.offsetWidth;
  ctx.charEl.classList.add('jump');
}

async function praise(ctx) {
  sfx.sparkle();
  happy(ctx);
  const c = centerOf(ctx.charEl);
  burst(c.x, c.y, 12);
  await ctx.say(pick(ctx.data.praise));
}

// お手本 →「Your turn!」→ 録音（ふつうは3秒）→ 自分の声を再生 → ほめる（判定・点数なし）
async function yourTurn(ctx, sceneId, sayText, { model = true, who, question = null, praiseAfter = true, ms = 3000 } = {}) {
  if (model) await ctx.say(sayText, who || ctx.char.id);
  await ctx.say(ctx.data.your_turn);
  const ui = recorderUI();
  try {
    const blob = await record(ms, v => ui.level(v), () => ui.start(ms));
    ctx.check();
    if (blob && blob.size > 200) {
      store.addRecording({ blob, line: sayText, question, step: ctx.stepN, corner: 'bakery', scene: sceneId, character: ctx.char.id });
      ui.playing();
      await playBlob(blob, { maxMs: ms + 2000 });
    }
  } finally {
    ui.hide();
  }
  ctx.check();
  if (praiseAfter) await praise(ctx);
}

// 場面の最後の「言う」。質問で終わる場面（Step 3）はお手本なしで自分で答える
async function sayStep(ctx, scene, lastLine, opts = {}) {
  const s = sayOf(ctx, scene);
  if (!s) return;
  const q = isQuestion(lastLine);
  await yourTurn(ctx, scene.id, s, { model: !q, question: q ? lastLine : null, ...opts });
}

function glow(tray, keys) {
  tray.querySelectorAll('.item').forEach(n => n.classList.toggle('glow', keys.includes(n.dataset.k) && !n.classList.contains('used')));
}

// 指示どおりに置く。違うものは「try again」→ 指示をもう一度言う。2回違ったら正解が光る
function needTask(ctx, { tray, needs, place, count = true, consume = false, line = null }) {
  let wrong = 0;
  let retrying = false;
  const placed = {};
  const remaining = () => Object.keys(needs).filter(k => (placed[k] || 0) < needs[k]);
  return ctx.until(resolve => {
    tray.querySelectorAll('.item').forEach(node => {
      node._onDrop = (pt, tap) => {
        const k = node.dataset.k;
        if (remaining().includes(k)) {
          placed[k] = (placed[k] || 0) + 1;
          if (consume) node.classList.add('used');
          place(k, pt, tap);
          glow(tray, []);
          if (count && needs[k] > 1) {
            bigNumber(placed[k]);
            sfx.count(placed[k]);
            ctx.sayLater(countWord(placed[k]));
          } else {
            sfx.pop();
          }
          if (!remaining().length) {
            tray.querySelectorAll('.item').forEach(n => { n._onDrop = null; });
            resolve();
          }
          return true;
        }
        wrong++;
        sfx.boing();
        if (wrong >= 2) glow(tray, remaining());
        // 続けて間違えても、声は重ねない
        if (!retrying) {
          retrying = true;
          ctx.say(pick(ctx.data.retry))
            .then(() => line && ctx.say(line))
            .catch(() => {})
            .finally(() => { retrying = false; });
        }
        return false;
      };
    });
  });
}

function trayHTML(keys, cls = '') {
  return `<div class="tray ${cls}">${keys.map(k => `<div class="item" data-k="${k}">${ITEMS[k]}</div>`).join('')}</div>`;
}

function wireTray(ctx, tray, target) {
  tray.querySelectorAll('.item').forEach(node => {
    makeDraggable(node, { target, onDrop: (pt, tap) => (node._onDrop ? node._onDrop(pt, tap) : false) });
  });
}

// ---------- ボウル ----------

function bowlHTML(ctx) {
  const items = ctx.bowl.map(b => `<span class="in-bowl" style="left:${b.x}%;top:${b.y}%">${ITEMS[b.k]}</span>`).join('');
  return `<div class="bowl ${ctx.bowl.length ? 'filled' : ''} ${ctx.mixed ? 'mixed' : ''}">${bowlSVG()}<div class="bowl-items">${items}</div></div>`;
}

function addToBowl(ctx, bowlNode, k) {
  const b = { k, x: 26 + Math.random() * 48, y: 26 + Math.random() * 8 };
  ctx.bowl.push(b);
  bowlNode.classList.add('filled');
  const s = el(`<span class="in-bowl drop-in" style="left:${b.x}%;top:${b.y}%">${ITEMS[k]}</span>`);
  bowlNode.querySelector('.bowl-items').appendChild(s);
  const c = centerOf(s);
  burst(c.x, c.y, 6);
}

// ---------- カップケーキ ----------

function cupcakeHTML(ctx, { state = 'baked', cls = '' } = {}) {
  const tops = ctx.toppings.map(t => `<span class="topping" style="left:${t.x}%;top:${t.y}%">${ITEMS[t.k]}</span>`).join('');
  return `<div class="cupcake ${cls}">${cupcakeSVG({ state, color: ctx.color })}<div class="tops">${tops}</div></div>`;
}

function addTopping(ctx, cupNode, k, pt, tap) {
  const r = cupNode.getBoundingClientRect();
  // クリームは上ほど細いので、高さに合わせて横の範囲を決める
  const span = y => (y < 30 ? 14 : y < 42 ? 24 : 32);
  let x, y;
  if (tap || !pt) {
    y = 20 + Math.random() * 32;
    x = 50 + (Math.random() * 2 - 1) * span(y);
  } else {
    y = Math.min(54, Math.max(18, ((pt.y - r.top) / r.height) * 100));
    x = Math.min(50 + span(y), Math.max(50 - span(y), ((pt.x - r.left) / r.width) * 100));
  }
  const t = { k, x, y };
  ctx.toppings.push(t);
  const s = el(`<span class="topping drop-in" style="left:${x}%;top:${y}%">${ITEMS[k]}</span>`);
  cupNode.querySelector('.tops').appendChild(s);
  const c = centerOf(s);
  burst(c.x, c.y, 6);
}

// ---------- 場面 ----------

const SCENES = {
  async start(ctx, sc) {
    ctx.work.innerHTML = `<div class="center-stage"><div class="hero">${cupcakeSVG({ color: 'pink' })}</div></div>`;
    for (const l of linesOf(ctx, sc)) await ctx.line(l);
    await ctx.pause(300);
  },

  async ingredients(ctx, sc) {
    const lines = linesOf(ctx, sc);
    const choices = sc.choices?.[ctx.step] || [];
    const answer = sc.answer?.[ctx.step];
    // 台に出すのは、この場面の指示に出てくる材料と選択肢だけ（卵は次の場面で入れる）
    const named = vocab(ctx, 'ingredients').filter(k => lines.some(l => parseNeeds(l, [k])[k]));
    const keys = [...new Set([...named, ...choices])];
    ctx.work.innerHTML = `<div class="kitchen">${bowlHTML(ctx)}${trayHTML(keys)}</div>`;
    const bowl = ctx.work.querySelector('.bowl');
    const tray = ctx.work.querySelector('.tray');
    wireTray(ctx, tray, bowl);
    for (const line of lines) {
      // Step 3 の「What do we need?」は選択肢から answer を選ぶ
      const needs = isQuestion(line) && answer ? { [answer]: 1 } : parseNeeds(line, keys);
      const task = needTask(ctx, { tray, needs, line, place: k => { sfx.plop(); addToBowl(ctx, bowl, k); } });
      await ctx.line(line);
      await task;
      await ctx.pause(500);
    }
    await praise(ctx);
  },

  async count_eggs(ctx, sc) {
    const [line] = linesOf(ctx, sc);
    const sayText = sayOf(ctx, sc);
    const n = firstNumber(line) || firstNumber(sayText) || 3;
    ctx.work.innerHTML = `<div class="kitchen">${bowlHTML(ctx)}${trayHTML(Array(n).fill('eggs'), 'carton')}</div>`;
    const bowl = ctx.work.querySelector('.bowl');
    const tray = ctx.work.querySelector('.tray');
    wireTray(ctx, tray, bowl);

    if (isQuestion(line)) {
      // Step 3: 卵が入るのを見て、いくつか答える
      await ctx.pause(400);
      for (const node of tray.querySelectorAll('.item')) {
        node.classList.add('used');
        sfx.plop();
        addToBowl(ctx, bowl, 'eggs');
        await ctx.pause(800);
      }
      await ctx.line(line);
      await sayStep(ctx, sc, line);
      return;
    }

    // Step 1・2: 「Two eggs.」→ 1つずつ入れて数える → 真似する
    const intro = sentences(line)[0];
    const task = needTask(ctx, { tray, needs: { eggs: n }, consume: true, place: k => addToBowl(ctx, bowl, k) });
    await ctx.line(intro);
    await task;
    await ctx.pause(700);
    await sayStep(ctx, sc, line);
  },

  async stir(ctx, sc) {
    const [line] = linesOf(ctx, sc);
    ctx.work.innerHTML = `<div class="kitchen stir-scene">${bowlHTML(ctx)}<div class="stir-hint"></div></div>`;
    const bowl = ctx.work.querySelector('.bowl');
    const hint = ctx.work.querySelector('.stir-hint');
    const spoon = el(`<span class="spoon">🥄</span>`);
    bowl.appendChild(spoon);
    const goal = 3;
    let stirs = 0;
    const task = ctx.until(resolve => {
      let last = null, dist = 0, angle = 0;
      const unit = bowl.getBoundingClientRect().width * 1.0;
      const pos = e => {
        const r = bowl.getBoundingClientRect();
        spoon.style.left = ((e.clientX - r.left) / r.width) * 100 + '%';
        spoon.style.top = ((e.clientY - r.top) / r.height) * 100 + '%';
      };
      bowl.onpointerdown = e => {
        last = { x: e.clientX, y: e.clientY };
        bowl.setPointerCapture(e.pointerId);
        spoon.classList.add('on');
        hint.classList.add('off');
        pos(e);
      };
      bowl.onpointermove = e => {
        if (!last) return;
        const d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
        last = { x: e.clientX, y: e.clientY };
        dist += d;
        angle += d * 0.8;
        bowl.style.setProperty('--swirl', angle + 'deg');
        pos(e);
        if (dist >= unit) {
          dist = 0;
          stirs++;
          sfx.swish();
          happy(ctx);
          bowl.style.setProperty('--mix', Math.min(1, stirs / goal));
          if (stirs >= goal) {
            bowl.onpointerdown = bowl.onpointermove = bowl.onpointerup = null;
            spoon.classList.remove('on');
            resolve();
          }
        }
      };
      bowl.onpointerup = bowl.onpointercancel = () => { last = null; spoon.classList.remove('on'); };
    });
    await ctx.line(line);
    await task;
    ctx.mixed = true;
    ctx.bowl = [];
    bowl.classList.add('mixed');
    sfx.sparkle();
    await ctx.pause(600);
    await sayStep(ctx, sc, line);
  },

  async bake(ctx, sc) {
    const lines = linesOf(ctx, sc);
    ctx.work.innerHTML = `<div class="bake-scene">${cupcakeHTML(ctx, { state: 'batter', cls: 'raw tap-me' })}<div class="bake-arrow">➜</div><div class="oven">${ovenSVG()}</div></div>`;
    const oven = ctx.work.querySelector('.oven');
    const cup = ctx.work.querySelector('.cupcake');
    // カップケーキを指でオーブンまで運ぶ（タップだけでは入らない）
    const inOven = ctx.until(resolve => {
      makeDraggable(cup, {
        target: oven,
        tap: false,
        onTap: () => { cup.classList.remove('wiggle'); void cup.offsetWidth; cup.classList.add('wiggle'); },
        onDrop: () => { resolve(); return true; },
      });
    });
    // 「Into the oven!」を合図として先に言う
    const { cue, rest } = bakeCue(lines[0]);
    if (cue) {
      await ctx.line(cue);
      lines[0] = rest;
    }
    await inOven;
    sfx.pop();
    cup.classList.add('in-oven');
    ctx.work.querySelector('.bake-arrow').remove();
    oven.classList.add('on');
    let counted = 0;

    for (const l of lines.filter(Boolean)) {
      const part = bakeLine(l);
      if (part.ding) {
        sfx.ding();
        oven.classList.remove('on');
        cup.outerHTML = cupcakeHTML(ctx, { state: 'baked', cls: 'out-of-oven' });
        const c = centerOf(oven);
        burst(c.x, c.y, 14);
        await ctx.pause(500);
      }
      // 「Let's count. One, two, …」は前置きを言ってから1つずつ数える
      if (part.say) await ctx.line(part.say);
      if (part.count) { counted = part.count; await countAlong(ctx, part.count, oven); }
    }
    await ctx.pause(400);
    // 1〜5（10）を数える声が入るように、数に合わせて長く録音する
    await sayStep(ctx, sc, lines.filter(Boolean).pop(), { ms: Math.max(3000, counted * 1000 + 2000) });
  },

  async frosting(ctx, sc) {
    const lines = sc.lines[ctx.step] || [];
    const colors = sc.colors?.[ctx.step] || sc.colors?.step2 || sc.colors?.step1 || Object.keys(COLORS);
    // {order_color} がある段階（Step 3）は、注文の色を毎回ランダムに決めて、それが正解
    const hasOrder = lines.some(l => l.includes('{order_color}'));
    ctx.orderColor = hasOrder ? pick(colors) : null;
    const target = ctx.orderColor;
    const first = fill(lines[0], ctx);
    ctx.work.innerHTML = `<div class="frost-scene">${cupcakeHTML(ctx)}<div class="palette">${colors.map(c =>
      `<button class="swatch item" data-k="${c}" style="--c:${COLORS[c]}"><svg viewBox="0 0 100 80"><path d="M10 70 Q8 46 34 44 Q30 22 50 8 Q70 22 66 44 Q92 46 90 70 Q50 80 10 70Z" fill="${COLORS[c]}"/><path d="M28 56 q10-6 22-5 M44 34 q4-8 9-12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/></svg></button>`).join('')}</div></div>`;
    const palette = ctx.work.querySelector('.palette');
    let wrong = 0;
    let retrying = false;
    const task = ctx.until(resolve => {
      palette.querySelectorAll('.swatch').forEach(b => {
        b.onclick = () => {
          const c = b.dataset.k;
          if (target && c !== target) {
            wrong++;
            sfx.boing();
            if (wrong >= 2) glow(palette, [target]);
            if (!retrying) {
              retrying = true;
              ctx.say(pick(ctx.data.retry)).then(() => ctx.say(first)).catch(() => {}).finally(() => { retrying = false; });
            }
            return;
          }
          palette.querySelectorAll('.swatch').forEach(x => { x.onclick = null; x.classList.toggle('chosen', x === b); });
          resolve(c);
        };
      });
    });
    await ctx.line(first);
    ctx.color = await task;
    glow(palette, []);
    const cup = ctx.work.querySelector('.cupcake');
    cup.outerHTML = cupcakeHTML(ctx, { cls: 'frosted' });
    sfx.sparkle();
    const c = centerOf(ctx.work.querySelector('.cupcake'));
    burst(c.x, c.y - 40, 16);
    let last = first;
    for (const l of lines.slice(1)) { last = fill(l, ctx); await ctx.line(last); }
    await sayStep(ctx, sc, last);
  },

  async decorate_instruction(ctx, sc) {
    const lines = linesOf(ctx, sc);
    if (!lines.length) return; // Step 3 はとばして自由に飾る
    const keys = vocab(ctx, 'toppings');
    ctx.work.innerHTML = `<div class="deco-scene">${cupcakeHTML(ctx)}${trayHTML(keys)}</div>`;
    const cup = ctx.work.querySelector('.cupcake');
    const tray = ctx.work.querySelector('.tray');
    wireTray(ctx, tray, cup);
    for (const line of lines) {
      const needs = parseNeeds(line, keys);
      const task = needTask(ctx, { tray, needs, line, place: (k, pt, tap) => addTopping(ctx, cup, k, pt, tap) });
      await ctx.line(line);
      await task;
      await ctx.pause(700);
    }
    await praise(ctx);
  },

  async decorate_free(ctx, sc) {
    const keys = vocab(ctx, 'toppings');
    ctx.work.innerHTML = `<div class="deco-scene">${cupcakeHTML(ctx)}${trayHTML(keys)}<button class="done-btn hidden" aria-label="できた">${ICONS.check}</button></div>`;
    const cup = ctx.work.querySelector('.cupcake');
    const tray = ctx.work.querySelector('.tray');
    const done = ctx.work.querySelector('.done-btn');
    wireTray(ctx, tray, cup);
    // 正解なし。何を置いてもOK
    tray.querySelectorAll('.item').forEach(node => {
      node._onDrop = (pt, tap) => {
        if (ctx.toppings.length < 40) addTopping(ctx, cup, node.dataset.k, pt, tap);
        sfx.pop();
        done.classList.remove('hidden');
        return true;
      };
    });
    setTimeout(() => done.classList.remove('hidden'), 8000);
    await ctx.until(resolve => { done.onclick = () => { sfx.sparkle(); resolve(); }; });
    tray.querySelectorAll('.item').forEach(n => { n._onDrop = null; });
    done.remove();
    const c = centerOf(cup);
    burst(c.x, c.y - 40, 18);
    happy(ctx);
    const lines = linesOf(ctx, sc);
    for (const l of lines) await ctx.line(l);
    await sayStep(ctx, sc, lines[lines.length - 1]);
  },

  async serve(ctx, sc) {
    ctx.work.innerHTML = `<div class="serve-scene">${cupcakeHTML(ctx, { cls: 'give-me' })}<div class="give-arrow">➜</div></div>`;
    const cup = ctx.work.querySelector('.cupcake');
    const target = ctx.charEl.closest('.char-area');
    // 「Give it to Mimi!」など渡す前の指示 → 渡したあとのセリフ
    const all = linesOf(ctx, sc);
    const n = all.findIndex(l => !isGiveLine(l));
    const before = n < 0 ? all : all.slice(0, n);
    const lines = n < 0 ? [] : all.slice(n);
    let reminder = 0;
    const given = ctx.until(resolve => {
      makeDraggable(cup, { target, onDrop: () => { resolve(); return true; }, ghostClass: 'ghost-cupcake' });
    });
    for (const l of before) await ctx.line(l);
    if (before.length) reminder = setInterval(() => ctx.sayLater(before[before.length - 1]), 10000);
    try { await given; } finally { clearInterval(reminder); }
    cup.classList.add('given');
    ctx.work.querySelector('.give-arrow').remove();
    ctx.charEl.classList.add('holding-cake');
    happy(ctx);
    const last = lines[lines.length - 1];
    if (isQuestion(last)) {
      for (const l of lines) await ctx.line(l);
      await sayStep(ctx, sc, last);
    } else {
      // 渡しながら「Here you go!」→ キャラクターが「Yummy! Thank you!」
      await yourTurn(ctx, sc.id, sayOf(ctx, sc), { who: 'narrator', praiseAfter: false });
      ctx.charEl.classList.add('eating');
      sfx.sparkle();
      for (const l of lines) await ctx.line(l);
    }
  },

  async reward(ctx, sc) {
    const lines = linesOf(ctx, sc);
    const layout = ctx.charEl.closest('.play-layout');
    ctx.charEl.classList.remove('holding-cake', 'eating');
    const sticker = { color: ctx.color, toppings: ctx.toppings.slice(0, 24), at: Date.now() };
    store.update(s => {
      s.stickers.push(sticker);
      s.plays.bakery = (s.plays.bakery || 0) + 1;
    });
    // セリフの最初の文（You did it!）を大きな文字で飛び出させる
    const cheer = sentences(lines[0] || '')[0] || '';
    ctx.work.innerHTML = `<div class="reward-scene"><div class="cheer-text">${cheer}</div><div class="sticker-big hidden">${stickerHTML(sticker)}</div></div>`;
    layout.classList.add('cheer-mode');
    ctx.charEl.classList.add('celebrate');
    popConfetti();
    sfx.fanfare();
    try {
      for (const l of lines) await ctx.line(l);
      // ステッカーが出てくる
      const big = ctx.work.querySelector('.sticker-big');
      big.classList.remove('hidden');
      sfx.sparkle();
      const c = centerOf(big);
      burst(c.x, c.y, 24);
      await ctx.pause(2500);
    } finally {
      ctx.charEl.classList.remove('celebrate');
      layout.classList.remove('cheer-mode');
    }
  },
};

async function countAlong(ctx, n, oven) {
  for (let i = 1; i <= n; i++) {
    bigNumber(i);
    sfx.count(Math.min(i, 8));
    oven?.style.setProperty('--heat', i / n);
    await ctx.say(countWord(i));
    await ctx.pause(250);
  }
}

// クラッカー: 画面の左下と右下から紙ふぶきを飛ばす
function popConfetti() {
  const o = document.querySelector('#overlay');
  const colors = ['#FF6FB5', '#9B6BFF', '#4FB3FF', '#FFD23F', '#3DD07A', '#FF8A3D'];
  for (const side of [-1, 1]) {
    sfx.pop();
    const popper = el(`<div class="popper ${side < 0 ? 'left' : 'right'}"><svg viewBox="0 0 100 100"><path d="M10 90 L40 20 L80 60 Z" fill="#FFD23F"/><path d="M22 62 L52 48 M30 44 L62 66" stroke="#FF6FB5" stroke-width="8" stroke-linecap="round"/></svg></div>`);
    o.appendChild(popper);
    setTimeout(() => popper.remove(), 3000);
    for (let i = 0; i < 40; i++) {
      const p = el(`<i class="confetti"></i>`);
      p.style.background = colors[i % colors.length];
      p.style.left = side < 0 ? '8%' : '92%';
      // 斜め上に飛んで、ひらひら落ちる
      p.style.setProperty('--dx', `${side * -(15 + Math.random() * 40)}vw`);
      p.style.setProperty('--dy', `${-(35 + Math.random() * 45)}vh`);
      p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
      p.style.animationDelay = `${Math.random() * 0.15}s`;
      if (i % 3 === 0) p.style.borderRadius = '50%';
      o.appendChild(p);
      setTimeout(() => p.remove(), 3200);
    }
  }
}

export function stickerHTML(st) {
  const tops = (st.toppings || []).map(t => `<span class="topping" style="left:${t.x}%;top:${t.y}%">${ITEMS[t.k]}</span>`).join('');
  return `<div class="sticker"><div class="cupcake">${cupcakeSVG({ color: st.color })}<div class="tops">${tops}</div></div></div>`;
}

// ---------- 実行 ----------

async function runBakery({ data, step, charId, work, charEl, onExit }, controller) {
  const { signal } = controller;
  const char = data.characters.find(c => c.id === charId);
  let chain = Promise.resolve();

  const ctx = {
    data, step: 'step' + step, stepN: step, char, work, charEl, signal,
    color: null, toppings: [], bowl: [], mixed: false, currentLine: null,
    check() { if (signal.aborted) throw new Abort(); },
    async say(text, who = char.id) {
      ctx.check();
      chain = chain.then(() => speak(text, who, { signal }));
      await chain;
      ctx.check();
    },
    sayLater(text, who) { ctx.say(text, who).catch(() => {}); },
    async line(text) { ctx.currentLine = text; await ctx.say(text); },
    async pause(ms) { await sleep(ms); ctx.check(); },
    until(setup) {
      return new Promise((resolve, reject) => {
        const onAbort = () => reject(new Abort());
        signal.addEventListener('abort', onAbort, { once: true });
        setup(v => { signal.removeEventListener('abort', onAbort); resolve(v); });
      });
    },
  };

  // キャラクターをタップすると、今の指示をもう一度言う
  charEl.onclick = () => { if (ctx.currentLine) ctx.sayLater(ctx.currentLine); happy(ctx); };

  try {
    for (const scene of data.scenes) {
      ctx.check();
      ctx.currentLine = null;
      await SCENES[scene.id]?.(ctx, scene);
    }
    work.innerHTML = `<div class="end-scene">${stickerHTML(store.load().stickers.slice(-1)[0] || {})}<button class="end-home" aria-label="おうちにもどる">${ICONS.home}</button></div>`;
    await ctx.until(resolve => { work.querySelector('.end-home').onclick = resolve; });
  } catch (e) {
    if (!(e instanceof Abort)) console.error(e);
  } finally {
    releaseMic();
    charEl.onclick = null;
    charEl.className = 'character';
    charEl.closest('.play-layout').classList.remove('cheer-mode');
    onExit();
  }
}

// 外から止められるように、開始と停止を分けて返す
export function startBakery(opts) {
  const controller = new AbortController();
  const done = runBakery(opts, controller);
  return { done, stop: () => controller.abort() };
}
