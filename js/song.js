// 歌のメロディ: 童謡「Here We Go Round the Mulberry Bush」（著作権切れ）
// ごほうびの仮の音声と、保護者画面で録音するときのガイドの両方で使う
import { playMelody } from './audio.js';

export const EIGHTH = 0.22;          // 8分音符の秒数
export const LINE_SEC = 12 * EIGHTH; // 歌詞1行の長さ

const MELODY = {
  a: [['G4', 2], ['G4', 1], ['G4', 2], ['B4', 1], ['D5', 2], ['D5', 1], ['B4', 2], ['G4', 1]],
  b: [['A4', 2], ['A4', 1], ['F#4', 2], ['D4', 1], ['B4', 2], ['B4', 1], ['G4', 3]],
  c: [['A4', 2], ['A4', 1], ['D4', 2], ['D4', 1], ['G4', 3], [null, 3]],
};

// 前奏1行 + 歌詞の行数ぶん
function songNotes(lineCount) {
  const verse = [MELODY.a, MELODY.b, MELODY.a, MELODY.c];
  const notes = [...MELODY.c];
  for (let i = 0; i < lineCount; i++) notes.push(...verse[i % 4]);
  return notes;
}

// { seconds, stop() } を返す。歌詞 i 行目は LINE_SEC * (i + 1) 秒から
export function playSongMelody(lineCount) {
  return playMelody(songNotes(lineCount), { eighth: EIGHTH });
}
