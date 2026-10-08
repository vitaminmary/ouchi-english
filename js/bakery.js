// コーナー01 お菓子作り（カップケーキ）
// セリフ・単語はすべて data/01_bakery.json から読む。ここで英語の文を作らない。
import { speak, sfx, record, playBlob, releaseMic } from './audio.js';
import { playSongMelody, LINE_SEC } from './song.js';
import { el, sleep, makeDraggable, bigNumber, burst, recorderUI, centerOf } from './ui.js';
import { cupcakeSVG, bowlSVG, ovenSVG, ITEMS, COLORS } from './art.js';
import * as store from './store.js';

import { NUM, words, isQuestion, sentences, firstNumber, countWord, stirWord, fillTemplate, bakeCue, bakeLine, isGiveLine } from './text.js';
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

// お手本 →「Your turn!」→ 3秒録音 → 自分の声を再生 → ほめる（判定・点数なし）
async function yourTurn(ctx, sceneId, sayText, { model = true, who, question = null, praiseAfter = true } = {}) {
  if (model) await ctx.say(sayText, who || ctx.char.id);
  await ctx.say(ctx.data.your_turn);
  const ui = recorderUI();
  try {
    const blob = await record(3000, v => ui.level(v), () => ui.start(3000));
    ctx.check();
    if (blob && blob.size > 200) {
      store.addRecording({ blob, line: sayText, question, step: ctx.stepN, corner: 'bakery', scene: sceneId, character: ctx.char.id });
      ui.playing();
      await playBlob(blob);
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

// 指示どおりに置く。違うものは「try again」、2回違ったら正解が光る
function needTask(ctx, { tray, needs, place, count = true, consume = false }) {
  let wrong = 0;
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
        ctx.sayLater(pick(ctx.data.retry));
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
      const task = needTask(ctx, { tray, needs, place: k => { sfx.plop(); addToBowl(ctx, bowl, k); } });
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
          ctx.sayLater(stirWord(line));
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
    ctx.work.innerHTML = `<div class="bake-scene">${cupcakeHTML(ctx, { state: 'batter', cls: 'raw' })}<div class="oven tap-me">${ovenSVG()}</div></div>`;
    const oven = ctx.work.querySelector('.oven');
    const cup = ctx.work.querySelector('.cupcake');
    // 「Into the oven!」をタップの合図として先に言う
    const { cue, rest } = bakeCue(lines[0]);
    if (cue) {
      await ctx.line(cue);
      lines[0] = rest;
    }
    await ctx.until(resolve => {
      oven.onclick = cup.onclick = () => { oven.onclick = cup.onclick = null; resolve(); };
    });
    sfx.pop();
    oven.classList.remove('tap-me');
    cup.classList.add('into-oven');
    oven.classList.add('on');

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
      if (part.count) await countAlong(ctx, part.count, oven);
    }
    await ctx.pause(400);
    await sayStep(ctx, sc, lines.filter(Boolean).pop());
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
      `<button class="swatch item" data-k="${c}" style="--c:${COLORS[c]}"><svg viewBox="0 0 100 80"><path d="M10 70 Q8 46 34 44 Q30 22 50 8 Q70 22 66 44 Q92 46 90 70 Q50 80 10 70Z" fill="${COLORS[c]}" stroke="#5a3d4f" stroke-width="4"/><path d="M28 56 q10-6 22-5 M44 34 q4-8 9-12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/></svg></button>`).join('')}</div></div>`;
    const palette = ctx.work.querySelector('.palette');
    let wrong = 0;
    const task = ctx.until(resolve => {
      palette.querySelectorAll('.swatch').forEach(b => {
        b.onclick = () => {
          const c = b.dataset.k;
          if (target && c !== target) {
            wrong++;
            sfx.boing();
            if (wrong >= 2) glow(palette, [target]);
            ctx.sayLater(pick(ctx.data.retry));
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
      const task = needTask(ctx, { tray, needs, place: (k, pt, tap) => addTopping(ctx, cup, k, pt, tap) });
      await ctx.line(line);
      await task;
      await ctx.pause(700);
    }
    await praise(ctx);
  },

  async decorate_free(ctx, sc) {
    const keys = vocab(ctx, 'toppings');
    ctx.work.innerHTML = `<div class="deco-scene">${cupcakeHTML(ctx)}${trayHTML(keys)}<button class="done-btn hidden" aria-label="できた">💖</button></div>`;
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
    ctx.charEl.classList.remove('holding-cake', 'eating');
    const sticker = { color: ctx.color, toppings: ctx.toppings.slice(0, 24), at: Date.now() };
    ctx.work.innerHTML = `<div class="reward-scene"><div class="sticker-big">${stickerHTML(sticker)}</div></div>`;
    sfx.fanfare();
    const c = centerOf(ctx.work.querySelector('.sticker-big'));
    burst(c.x, c.y, 24);
    store.update(s => {
      s.stickers.push(sticker);
      s.plays.bakery = (s.plays.bakery || 0) + 1;
    });
    for (const l of lines) await ctx.line(l);
    await ctx.pause(600);
    const song = ctx.data.songs?.[sc.song];
    // 歌の「Yummy!」は一緒に言えたらOK。この場面は録音しない
    if (song) await sing(ctx, song, sc.song);
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

// 保護者の歌声があればそれを流す。なければメロディ＋読み上げの仮の音声
async function sing(ctx, song, songId) {
  const rec = song.parent_recording ? await store.getSongRecording(songId) : null;
  ctx.check();
  ctx.work.innerHTML = `<div class="song-scene"><div class="notes">♪ ♫ ♪</div></div>`;
  const layout = ctx.charEl.closest('.play-layout');
  layout.classList.add('song-mode');
  ctx.charEl.classList.add('dancing', 'dance-stir');
  // ダンスは歌の後半（ハートの歌詞）で手の動きを変える
  const half = song.lyrics.length / 2;
  try {
    if (rec?.blob) {
      const t = setTimeout(() => ctx.charEl.classList.replace('dance-stir', 'dance-hearts'), (rec.durationMs || 30000) / 2);
      await playBlob(rec.blob, { maxMs: (rec.durationMs || 30000) + 2000, signal: ctx.signal });
      clearTimeout(t);
    } else {
      const melody = playSongMelody(song.lyrics.length);
      ctx.signal.addEventListener('abort', melody.stop, { once: true });
      const t0 = performance.now();
      for (let i = 0; i < song.lyrics.length; i++) {
        await sleep(Math.max(0, LINE_SEC * (i + 1) * 1000 - (performance.now() - t0)));
        ctx.check();
        if (i === half) ctx.charEl.classList.replace('dance-stir', 'dance-hearts');
        speak(song.lyrics[i], ctx.char.id, { signal: ctx.signal, rate: 1.05, ttsOnly: true });
      }
      await sleep(Math.max(0, melody.seconds * 1000 - (performance.now() - t0)));
    }
  } finally {
    ctx.charEl.classList.remove('dancing', 'dance-stir', 'dance-hearts');
    layout.classList.remove('song-mode');
  }
  ctx.check();
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
    work.innerHTML = `<div class="end-scene">${stickerHTML(store.load().stickers.slice(-1)[0] || {})}<button class="end-home" aria-label="おうちにもどる">🏠</button></div>`;
    await ctx.until(resolve => { work.querySelector('.end-home').onclick = resolve; });
  } catch (e) {
    if (!(e instanceof Abort)) console.error(e);
  } finally {
    releaseMic();
    charEl.onclick = null;
    charEl.className = 'character';
    charEl.closest('.play-layout').classList.remove('song-mode');
    onExit();
  }
}

// 外から止められるように、開始と停止を分けて返す
export function startBakery(opts) {
  const controller = new AbortController();
  const done = runBakery(opts, controller);
  return { done, stop: () => controller.abort() };
}
