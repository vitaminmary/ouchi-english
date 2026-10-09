// オフラインでも遊べるようにする。新しい内容があればそちらを優先（ネット優先・なければ保存分）
const CACHE = 'sumire-v8';
const SHELL = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/app.js', 'js/art.js', 'js/audio.js', 'js/bakery.js', 'js/store.js', 'js/text.js', 'js/ui.js',
  'data/01_bakery.json', 'img/characters/bebe.png', 'img/characters/mimi.png', 'img/characters/popo.png', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

// 声の音声ファイルも先に保存しておく（1つ失敗しても続ける）
async function cacheClips(c) {
  try {
    const res = await fetch('audio/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;
    await c.put('audio/manifest.json', res.clone());
    const files = [...new Set(Object.values((await res.json()).clips || {}))];
    await Promise.all(files.map(f => c.add(f).catch(() => {})));
  } catch { /* 音声ファイルがなければ読み上げを使う */ }
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => { await c.addAll(SHELL); await cacheClips(c); }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
