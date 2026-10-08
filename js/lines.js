// アプリが話すセリフをすべて書き出す（音声ファイルを前もって作るため）
// 返り値: [{ who: 'mimi' | 'bebe' | 'popo' | 'narrator', text }]
// 話す順番や分け方は bakery.js と同じ text.js の部品で組み立てる
import { NUM, isQuestion, sentences, countWord, stirWord, fillTemplate, bakeCue, bakeLine, isGiveLine } from './text.js';

const STEPS = ['step1', 'step2', 'step3'];

export function voiceLines(data) {
  const out = new Map();
  const add = (who, text) => { if (text) out.set(`${who}|${text}`, { who, text }); };

  const allColors = [...new Set([
    ...Object.values(data.vocabulary.step1.colors || []),
    ...(data.vocabulary.step2_add?.colors || []),
    ...data.scenes.flatMap(s => Object.values(s.colors || {}).flat()),
  ])];

  // テンプレートの組み合わせをすべて展開する
  const expand = (text, name) => {
    const colors = /\{(order_)?color\}/.test(text) ? allColors : [null];
    return colors.map(c => fillTemplate(text, { color: c || 'pink', orderColor: c || 'pink', name }));
  };

  for (const ch of data.characters) {
    const who = ch.id;
    const say = text => expand(text, ch.name).forEach(t => add(who, t));

    for (const sc of data.scenes) {
      for (const step of STEPS) {
        const lines = sc.lines?.[step] || [];
        for (const raw of lines) {
          for (const line of expand(raw, ch.name)) {
            if (sc.id === 'bake') continue; // 焼く場面は下で分けて読む
            // 卵の場面は「Two eggs.」だけ読む（数は1つずつ数える）。Step 3 は質問をそのまま読む
            if (sc.id === 'count_eggs' && !isQuestion(line)) add(who, sentences(line)[0]);
            else add(who, line);
            if (sc.id === 'stir') add(who, stirWord(line));
          }
        }
        if (sc.id === 'bake' && lines.length) {
          const filled = lines.map(l => fillTemplate(l, { name: ch.name }));
          const { cue, rest } = bakeCue(filled[0]);
          add(who, cue);
          for (const l of [rest, ...filled.slice(1)].filter(Boolean)) add(who, bakeLine(l).say);
        }
        // お手本（質問で終わる場面は自分で答えるので読まない）
        const model = sc.say?.[step];
        const last = lines[lines.length - 1];
        if (model && !isQuestion(last)) {
          if (sc.id === 'serve') {
            // 「Here you go!」は子ども役（ナレーション）が言う
            for (const c of data.characters) expand(model, c.name).forEach(t => add('narrator', t));
          } else {
            say(model);
          }
        }
        // 渡す前の指示は、くり返しにも同じ文を使う
        lines.filter(isGiveLine).forEach(say);
      }
    }

    data.praise.forEach(say);
    data.retry.forEach(say);
    say(data.your_turn);
    for (let n = 1; n <= Math.max(...Object.values(NUM)); n++) add(who, countWord(n));
    // 歌詞は原文のまま（文のはじめを大文字にしない）
    for (const song of Object.values(data.songs || {})) song.lyrics.forEach(l => add(who, l));
  }
  return [...out.values()];
}
