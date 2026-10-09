// セリフの文字を扱う部品（ブラウザと Node の両方で使う。画面には触らない）
// ゲーム（bakery.js）と音声ファイル作り（scripts/voices.mjs）で同じ組み立て方をするために共有する

export const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const NUM = Object.fromEntries(NUM_WORDS.map((w, i) => [w, i]));

export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const words = t => t.toLowerCase().replace(/[^a-z'\s]/g, ' ').split(/\s+/).filter(Boolean);
export const isQuestion = t => /\?\s*$/.test((t || '').trim());
export const sentences = t => (t.match(/[^.!?]+[.!?]*/g) || []).map(s => s.trim());
export const firstNumber = t => { const w = words(t || '').find(w => NUM[w]); return w ? NUM[w] : null; };

// 数を数える声（One! Two! …）
export const countWord = n => cap(NUM_WORDS[n]) + '!';

// {color} {order_color} {character} を入れて、文のはじめを大文字にする
export function fillTemplate(text, { color = 'pink', orderColor = 'pink', name = '' } = {}) {
  return text
    .replace(/\{color\}/g, color)
    .replace(/\{order_color\}/g, orderColor)
    .replace(/\{character\}/g, name)
    .replace(/(^|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
}

// 焼く場面: オーブンをタップする前に言う合図（「Into the oven!」）と、その残り
export function bakeCue(firstLine) {
  const [cue, ...rest] = sentences(firstLine || '');
  if (cue && !words(cue).some(w => NUM[w]) && !/count|ding/i.test(cue)) return { cue, rest: rest.join(' ') };
  return { cue: null, rest: firstLine };
}

// 焼く場面の1行を、話す部分に分ける
// 「Let's count. One, two, …」→ { say: "Let's count.", count: 5 } / 「Let's count to ten!」→ { say: 行全体, count: 10 }
export function bakeLine(line) {
  const seq = words(line).filter(w => NUM[w]);
  const countTo = line.match(/count to (\w+)/i);
  if (/\bding\b/i.test(line)) return { say: line, ding: true };
  if (seq.length >= 2) return { say: line.slice(0, line.toLowerCase().indexOf(seq[0])).trim() || null, count: seq.length };
  if (countTo && NUM[countTo[1].toLowerCase()]) return { say: line, count: NUM[countTo[1].toLowerCase()] };
  return { say: line };
}

// 「Give it to Mimi!」など、渡す前の指示か
export const isGiveLine = l => /^give\b/i.test(l);
