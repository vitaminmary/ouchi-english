// ElevenLabs でキャラクターの声を作り、セリフを音声ファイルにする
//
//   node scripts/voices.mjs list              作るセリフの数と文字数を見る（API は使わない）
//   node scripts/voices.mjs design [who…]     声の候補を作る → voices-preview/ に mp3 を保存
//   node scripts/voices.mjs pick <who> <番号>  候補から声を決めて保存する
//   node scripts/voices.mjs generate          足りない音声ファイルを作り、audio/manifest.json を書く
//   node scripts/voices.mjs fake              テスト用: 無音ファイルで manifest を作る（API は使わない）
//
// API キーは .env の ELEVENLABS_API_KEY に入れる（.env は公開しない）
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { voiceLines } from '../js/lines.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONFIG = join(ROOT, 'scripts/voices.config.json');
const AUDIO = join(ROOT, 'audio');
const PREVIEW = join(ROOT, 'voices-preview');
const API = 'https://api.elevenlabs.io';

const config = JSON.parse(await readFile(CONFIG, 'utf8'));
const data = JSON.parse(await readFile(join(ROOT, 'data/01_bakery.json'), 'utf8'));

async function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const envFile = join(ROOT, '.env');
  if (existsSync(envFile)) {
    const m = (await readFile(envFile, 'utf8')).match(/^\s*ELEVENLABS_API_KEY\s*=\s*"?([^"\n]+)"?/m);
    if (m) return m[1].trim();
  }
  console.error('API キーがありません。.env に ELEVENLABS_API_KEY=... を書いてください。');
  process.exit(1);
}

async function api(path, { body, query = '' } = {}) {
  const res = await fetch(`${API}${path}${query}`, {
    method: 'POST',
    headers: { 'xi-api-key': await apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res;
}

const saveConfig = () => writeFile(CONFIG, JSON.stringify(config, null, 2) + '\n');

// ---------- 声の候補を作る ----------
async function design(whos) {
  await mkdir(PREVIEW, { recursive: true });
  for (const who of whos.length ? whos : Object.keys(config.voices)) {
    const v = config.voices[who];
    console.log(`\n${who}: 候補を作っています…`);
    const res = await api('/v1/text-to-voice/design', {
      body: { voice_description: v.description, text: v.preview_text, model_id: config.design_model_id },
    });
    const { previews } = await res.json();
    v.candidates = [];
    for (const [i, p] of previews.entries()) {
      const file = join(PREVIEW, `${who}-${i + 1}.mp3`);
      await writeFile(file, Buffer.from(p.audio_base_64, 'base64'));
      v.candidates.push(p.generated_voice_id);
      console.log(`  ${i + 1}: ${file}`);
    }
    await saveConfig();
  }
}

async function pick(who, n) {
  const v = config.voices[who];
  const id = v?.candidates?.[Number(n) - 1];
  if (!id) throw new Error(`${who} の候補 ${n} がありません。先に design を実行してください。`);
  const res = await api('/v1/text-to-voice', {
    body: { voice_name: `Ouchi English ${who}`, voice_description: v.description, generated_voice_id: id },
  });
  v.voice_id = (await res.json()).voice_id;
  delete v.candidates;
  await saveConfig();
  console.log(`${who} の声を保存しました: ${v.voice_id}`);
}

// ---------- セリフを音声ファイルにする ----------
function fileFor({ who, text }) {
  const v = config.voices[who];
  const h = createHash('sha1')
    .update(JSON.stringify([config.model_id, config.output_format, v.voice_id, v.settings, text]))
    .digest('hex').slice(0, 12);
  return `audio/${who}/${h}.mp3`;
}

async function writeManifest(clips) {
  await mkdir(AUDIO, { recursive: true });
  await writeFile(join(AUDIO, 'manifest.json'), JSON.stringify({ clips }, null, 1) + '\n');
}

async function generate() {
  const lines = voiceLines(data);
  const missingVoice = [...new Set(lines.map(l => l.who))].filter(w => !config.voices[w]?.voice_id);
  if (missingVoice.length) throw new Error(`声がまだ決まっていません: ${missingVoice.join(', ')}（design → pick）`);
  const clips = {};
  let made = 0, chars = 0;
  for (const l of lines) {
    const rel = fileFor(l);
    clips[`${l.who}|${l.text}`] = rel;
    if (existsSync(join(ROOT, rel))) continue;
    const v = config.voices[l.who];
    const res = await api(`/v1/text-to-speech/${v.voice_id}`, {
      query: `?output_format=${config.output_format}`,
      body: { text: l.text, model_id: config.model_id, voice_settings: v.settings },
    });
    await mkdir(join(AUDIO, l.who), { recursive: true });
    await writeFile(join(ROOT, rel), Buffer.from(await res.arrayBuffer()));
    made++;
    chars += l.text.length;
    process.stdout.write(`\r作成 ${made}（${chars}文字）: ${l.who} ${l.text.slice(0, 40).padEnd(40)}`);
  }
  await writeManifest(clips);
  // 使わなくなったファイルを消す
  const used = new Set(Object.values(clips));
  let removed = 0;
  for (const who of await readdir(AUDIO, { withFileTypes: true })) {
    if (!who.isDirectory()) continue;
    for (const f of await readdir(join(AUDIO, who.name))) {
      const rel = `audio/${who.name}/${f}`;
      if (!used.has(rel)) { await rm(join(ROOT, rel)); removed++; }
    }
  }
  console.log(`\n完了: 新しく ${made} ファイル（${chars}文字）、全部で ${lines.length} セリフ、不要 ${removed} ファイルを削除`);
}

// テスト用: 0.2秒の無音 WAV をすべてのセリフに割り当てる
async function fake() {
  const rate = 8000, n = rate / 5;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  await mkdir(AUDIO, { recursive: true });
  await writeFile(join(AUDIO, '_silence.wav'), buf);
  const clips = Object.fromEntries(voiceLines(data).map(l => [`${l.who}|${l.text}`, 'audio/_silence.wav']));
  await writeManifest(clips);
  console.log(`テスト用 manifest を作りました（${Object.keys(clips).length} セリフ）。本番前に generate で上書きしてください。`);
}

function list() {
  const lines = voiceLines(data);
  const by = {};
  for (const l of lines) {
    by[l.who] ??= { lines: 0, chars: 0, todo: 0 };
    by[l.who].lines++;
    by[l.who].chars += l.text.length;
    if (!config.voices[l.who]?.voice_id || !existsSync(join(ROOT, fileFor(l)))) by[l.who].todo++;
  }
  console.table(by);
  console.log(`合計 ${lines.length} セリフ / ${lines.reduce((a, l) => a + l.text.length, 0)} 文字（モデル: ${config.model_id}）`);
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'design') await design(args);
  else if (cmd === 'pick') await pick(args[0], args[1]);
  else if (cmd === 'generate') await generate();
  else if (cmd === 'fake') await fake();
  else list();
} catch (e) {
  console.error('\nエラー:', e.message);
  process.exit(1);
}
