// 端末の中だけに保存する（設定・回数・ステッカーは localStorage、録音は IndexedDB）

const KEY = 'sumire.v1';
const DEFAULTS = { step: 1, plays: {}, stickers: [] };

export function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 保存できなくても遊べる */ }
}

export function update(fn) {
  const s = load();
  fn(s);
  save(s);
  return s;
}

// ---------- 録音（子どもの声 = recordings、保護者の歌声 = songs） ----------
let dbp = null;
function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open('sumire', 2);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('recordings')) d.createObjectStore('recordings', { keyPath: 'id', autoIncrement: true });
        if (!d.objectStoreNames.contains('songs')) d.createObjectStore('songs', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

function tx(store, mode, fn) {
  return db().then(d => new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => resolve(out instanceof IDBRequest ? out.result : out);
    t.onerror = () => reject(t.error);
  }));
}

export function addRecording(rec) {
  return tx('recordings', 'readwrite', s => s.add({ ...rec, createdAt: Date.now() })).catch(() => null);
}

export function listRecordings() {
  return tx('recordings', 'readonly', s => s.getAll()).then(r => (r || []).sort((a, b) => b.createdAt - a.createdAt)).catch(() => []);
}

export function deleteRecording(id) {
  return tx('recordings', 'readwrite', s => s.delete(id)).catch(() => null);
}

// 歌の差し替え用録音 { id: 歌のID, blob, durationMs, createdAt }
export function getSongRecording(id) {
  return tx('songs', 'readonly', s => s.get(id)).catch(() => null);
}

export function saveSongRecording(rec) {
  return tx('songs', 'readwrite', s => s.put({ ...rec, createdAt: Date.now() })).catch(() => null);
}

export function deleteSongRecording(id) {
  return tx('songs', 'readwrite', s => s.delete(id)).catch(() => null);
}

export function requestPersist() {
  navigator.storage?.persist?.().catch(() => {});
}
