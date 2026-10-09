import { characterHTML, cupcakeSVG } from './art.js';
import { onTalk, unlockAudio, sfx, stopSpeaking, record, playBlob, micPermission, loadClips } from './audio.js';
import { $, el, show, holdButton, makeSparkles, burst, centerOf } from './ui.js';
import { startBakery, stickerHTML } from './bakery.js';
import * as store from './store.js';

let data = null;
let current = null;

// 段階の説明（00_全体方針.md の表より）
const STEPS = [
  { n: 1, name: 'Step 1 まずここ', when: 'いま', listen: '単語1つ・短い指示', say: '単語を真似する' },
  { n: 2, name: 'Step 2 年少のうちに', when: '2027年度', listen: '2つ続きの指示', say: '短い文を真似する' },
  { n: 3, name: 'Step 3 入試までに', when: '2028年秋まで', listen: '質問', say: '自分で答える' },
];

const SCENE_JA = {
  count_eggs: '卵を数える', stir: 'まぜる', bake: '焼く', frosting: 'クリームの色', decorate_free: '自由に飾る', serve: 'どうぞ',
};

// ---------- ホーム ----------

function renderHome() {
  $('#homeEmblem').innerHTML = cupcakeSVG({ color: 'pink' });
  const chars = $('#homeChars');
  chars.innerHTML = '';
  for (const c of data.characters) {
    const b = el(`<button class="char-pick" aria-label="${c.name}"><div class="character idle">${characterHTML(c.id)}</div></button>`);
    b.onclick = () => startCorner(c.id, b);
    chars.appendChild(b);
  }
  const st = store.load().stickers.slice(-30).reverse();
  $('#stickerShelf').innerHTML = st.map(stickerHTML).join('');
}

async function startCorner(charId, btn) {
  if (current) return;
  unlockAudio();
  store.requestPersist();
  // 全画面にできなくても遊べる（待たない）
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  sfx.pop();
  const c = centerOf(btn);
  burst(c.x, c.y, 14);
  btn.classList.add('picked');
  await new Promise(r => setTimeout(r, 450));
  btn.classList.remove('picked');

  const charEl = $('#playChar');
  charEl.className = 'character';
  charEl.innerHTML = characterHTML(charId);
  $('#work').innerHTML = '';
  $('#overlay').innerHTML = '';
  show('play');
  current = startBakery({
    data, step: store.load().step, charId, work: $('#work'), charEl,
    onExit: () => { current = null; goHome(); },
  });
}

function goHome() {
  stopSpeaking();
  renderHome();
  show('home');
}

// 話しているキャラクターの口を動かす
onTalk((who, on) => {
  const c = $('#playChar');
  if (who === 'narrator') return;
  c.classList.toggle('talking', on);
});

// ---------- 保護者画面 ----------

function fmtDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function fmtTime(ts) {
  const d = new Date(ts);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function renderParent() {
  const s = store.load();
  $('#stepList').innerHTML = STEPS.map(x => `
    <label class="step-opt ${s.step === x.n ? 'on' : ''}">
      <input type="radio" name="step" value="${x.n}" ${s.step === x.n ? 'checked' : ''}>
      <span class="step-name">${x.name}<small>（目安: ${x.when}）</small></span>
      <span class="step-desc">聞く: ${x.listen}　／　言う: ${x.say}</span>
    </label>`).join('');
  $('#stepList').querySelectorAll('input').forEach(i => {
    i.onchange = () => { store.update(st => { st.step = Number(i.value); }); renderParent(); };
  });

  const plays = s.plays.bakery || 0;
  $('#playCounts').innerHTML = `<div class="count-row"><span>01 お菓子作り（カップケーキ）</span><b>${plays}回</b></div>`;

  const recs = await store.listRecordings();
  const list = $('#recList');
  if (!recs.length) {
    list.innerHTML = `<p class="p-empty">まだ録音はありません。</p>`;
    return;
  }
  const today = fmtDate(Date.now());
  const groups = new Map();
  for (const r of recs) {
    const k = fmtDate(r.createdAt);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  list.innerHTML = '';
  for (const [day, rs] of groups) {
    list.appendChild(el(`<h3 class="rec-day">${day === today ? '今日' : ''} ${day}</h3>`));
    for (const r of rs) {
      const row = el(`<div class="rec-row">
        <button class="p-play" aria-label="再生">▶</button>
        <div class="rec-text">
          ${r.question ? `<div class="rec-q">質問: ${r.question}</div><div class="rec-line">例: ${r.line}</div>` : `<div class="rec-line">${r.line}</div>`}
          <div class="rec-meta">${fmtTime(r.createdAt)}・Step ${r.step}・${SCENE_JA[r.scene] || r.scene}</div>
        </div>
        <button class="p-del" aria-label="削除">削除</button>
      </div>`);
      row.querySelector('.p-play').onclick = () => playBlob(r.blob);
      row.querySelector('.p-del').onclick = async () => {
        if (!confirm('この録音を削除しますか？')) return;
        await store.deleteRecording(r.id);
        renderParent();
      };
      list.appendChild(row);
    }
  }
}

async function micTest() {
  const status = $('#micStatus');
  unlockAudio();
  status.textContent = '録音中…（3秒）';
  const blob = await record(3000);
  if (!blob) {
    const p = await micPermission();
    status.textContent = p === 'denied'
      ? 'マイクがブロックされています。Chromeのアドレスバー左のアイコン →「権限」からマイクを許可してください。'
      : 'マイクが使えませんでした。';
    return;
  }
  status.textContent = '再生中…';
  await playBlob(blob);
  status.textContent = 'OK！ マイクが使えます。';
}

// ---------- はじまり ----------

async function init() {
  makeSparkles();
  [data] = await Promise.all([fetch('data/01_bakery.json').then(r => r.json()), loadClips()]);
  renderHome();

  holdButton($('#parentBtn'), 2000, () => { renderParent(); show('parent'); });
  holdButton($('#homeBtn'), 1200, () => current?.stop());
  $('#parentClose').onclick = () => { renderHome(); show('home'); };
  $('#micTest').onclick = micTest;

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
