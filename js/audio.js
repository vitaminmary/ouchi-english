// 音まわり: 英語の音声（端末の読み上げ）、効果音、メロディ、録音

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- Web Audio ----------
let ctx = null;
export function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, { at = 0, dur = 0.2, type = 'sine', gain = 0.18, to = null, dest = null } = {}) {
  const c = audioCtx();
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  pop: () => tone(520, { dur: 0.14, to: 980, gain: 0.2 }),
  plop: () => tone(240, { dur: 0.18, to: 110, gain: 0.25 }),
  sparkle: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, { at: i * 0.07, dur: 0.35, type: 'triangle', gain: 0.1 })),
  boing: () => tone(330, { dur: 0.3, to: 220, gain: 0.14, type: 'triangle' }),
  swish: () => tone(300, { dur: 0.22, to: 600, gain: 0.07, type: 'triangle' }),
  ding: () => { tone(1568, { dur: 1.2, gain: 0.22 }); tone(2093, { at: 0.02, dur: 1.0, gain: 0.12 }); },
  count: n => tone(440 * Math.pow(2, (n - 1) * 2 / 12), { dur: 0.25, type: 'triangle', gain: 0.14 }),
  fanfare: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, { at: i * 0.12, dur: i === 3 ? 0.7 : 0.2, type: 'triangle', gain: 0.14 })),
};

// ---------- 英語の読み上げ ----------
let voices = [];
function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

function pickVoice() {
  const us = voices.filter(v => /en[-_]US/i.test(v.lang));
  const prefer = [/google us english/i, /en-us-x-.*-(local|network)/i, /samantha/i, /female/i];
  for (const re of prefer) {
    const v = us.find(v => re.test(v.name) || re.test(v.voiceURI));
    if (v) return v;
  }
  return us[0] || voices.find(v => /^en/i.test(v.lang)) || null;
}

// キャラクターごとの声の高さ・速さ（子ども向けに少しゆっくり）
const VOICE = {
  mimi: { pitch: 1.35, rate: 0.85 },
  bebe: { pitch: 1.6, rate: 0.9 },
  popo: { pitch: 1.0, rate: 0.8 },
  narrator: { pitch: 1.15, rate: 0.85 },
};

let talkListener = () => {};
export function onTalk(fn) { talkListener = fn; }

export function speak(text, who = 'narrator', { signal, rate } = {}) {
  return new Promise(resolve => {
    if (signal?.aborted) return resolve();
    if (!window.speechSynthesis) { setTimeout(resolve, 500 + text.length * 70); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    const v = pickVoice();
    if (v) u.voice = v;
    const p = VOICE[who] || VOICE.narrator;
    u.pitch = p.pitch;
    u.rate = rate || p.rate;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      talkListener(who, false);
      resolve();
    };
    // Android で onend が来ないことがあるので、長さから見積もった時間で必ず終える
    const timer = setTimeout(finish, 2500 + text.length * 120);
    u.onend = finish;
    u.onerror = finish;
    signal?.addEventListener('abort', () => { speechSynthesis.cancel(); finish(); }, { once: true });
    talkListener(who, true);
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() { window.speechSynthesis?.cancel(); }

// 最初のタップで音を使えるようにする
export function unlockAudio() {
  audioCtx();
  if (window.speechSynthesis && !unlockAudio.done) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
    unlockAudio.done = true;
  }
}

// ---------- メロディ（オルゴール風） ----------
const NOTE = { D4: 293.66, 'F#4': 369.99, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G3: 196.0, D3: 146.83 };

function bell(freq, at, dur, dest) {
  tone(freq, { at, dur: Math.max(0.5, dur * 1.6), type: 'sine', gain: 0.16, dest });
  tone(freq * 2, { at, dur: 0.4, type: 'triangle', gain: 0.03, dest });
}

// notes: [[音名, 8分音符いくつ], ...]  eighth: 8分音符の秒数
// 返り値: { seconds: 長さ, stop(): 途中で止める }
export function playMelody(notes, { eighth = 0.2, bass = true } = {}) {
  const c = audioCtx();
  const bus = c.createGain();
  bus.connect(c.destination);
  let t = 0.05;
  for (const [n, len] of notes) {
    if (n) bell(NOTE[n], t, len * eighth, bus);
    t += len * eighth;
  }
  if (bass) {
    for (let b = 0.05; b < t - 0.1; b += eighth * 6) {
      tone(NOTE.G3, { at: b, dur: eighth * 2.5, gain: 0.07, dest: bus });
      tone(NOTE.D3, { at: b + eighth * 3, dur: eighth * 2.5, gain: 0.05, dest: bus });
    }
  }
  return { seconds: t, stop: () => bus.disconnect() };
}

// ---------- 録音 ----------
let stream = null;

export async function ensureMic() {
  if (stream) return stream;
  if (!navigator.mediaDevices?.getUserMedia) return null;
  try {
    // エコーキャンセルを切ると、Android で再生音が小さくなるのを避けやすい
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
  } catch {
    stream = null;
  }
  return stream;
}

export function releaseMic() {
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
}

export async function micPermission() {
  try {
    const st = await navigator.permissions.query({ name: 'microphone' });
    return st.state; // granted | denied | prompt
  } catch {
    return 'unknown';
  }
}

// 録音を始める。stop() で { blob, durationMs } を返す。マイクが使えないときは null
// onLevel(0〜1) で声の大きさを返す
export async function startRecording(onLevel = () => {}) {
  const s = await ensureMic();
  if (!s || !window.MediaRecorder) return null;
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(s, type ? { mimeType: type } : undefined);
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => { rec.onstop = r; });

  let raf = 0;
  try {
    const c = audioCtx();
    const src = c.createMediaStreamSource(s);
    const an = c.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    const buf = new Uint8Array(an.fftSize);
    const loop = () => {
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += (v - 128) * (v - 128);
      onLevel(Math.min(1, Math.sqrt(sum / buf.length) / 40));
      raf = requestAnimationFrame(loop);
    };
    loop();
  } catch { /* 声の大きさ表示は無くても録音はできる */ }

  rec.start();
  const t0 = performance.now();
  return {
    async stop() {
      const durationMs = Math.round(performance.now() - t0);
      if (rec.state !== 'inactive') rec.stop();
      await stopped;
      cancelAnimationFrame(raf);
      releaseMic();
      return { blob: new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' }), durationMs };
    },
  };
}

// ms ミリ秒録音する。マイクが使えないときは同じ時間待って null
export async function record(ms = 3000, onLevel = () => {}, onStart = () => {}) {
  const r = await startRecording(onLevel);
  onStart();
  await sleep(ms);
  return r ? (await r.stop()).blob : null;
}

// 録音を再生する。maxMs で必ず終える。signal で途中で止められる
export function playBlob(blob, { maxMs = 6000, signal } = {}) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      a.pause();
      URL.revokeObjectURL(url);
      resolve();
    };
    a.onended = finish;
    a.onerror = finish;
    signal?.addEventListener('abort', finish, { once: true });
    a.play().catch(finish);
    setTimeout(finish, maxMs);
  });
}
