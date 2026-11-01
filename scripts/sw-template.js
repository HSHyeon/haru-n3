/* Generated per build. Only Haru application files may enter this cache. */
const CACHE_NAME = __CACHE_NAME__;
const PRECACHE_URLS = __PRECACHE_URLS__;
const allowed = new Set(PRECACHE_URLS);
async function validate(response, path) {
  if (!response.ok || response.redirected || response.type === 'opaque') throw new Error('Uncacheable response');
  const type = response.headers.get('content-type') || '';
  if (path === '/index.html') {
    if (!type.includes('text/html') || !(await response.clone().text()).includes('name="haru-app"')) throw new Error('Not the Haru app');
  } else if (type.includes('text/html')) throw new Error('Unexpected authentication page');
  return response;
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Validate all downloads before modifying the new cache.
    const entries = await Promise.all(PRECACHE_URLS.map(async path => [path, await validate(await fetch(new Request(path, {cache:'reload', credentials:'same-origin'})), path)]));
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(entries.map(([path,response]) => cache.put(path,response)));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('haru-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CACHE_STATUS') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const ready = (await Promise.all(PRECACHE_URLS.map(path=>cache.match(path)))).every(Boolean);
      event.ports[0]?.postMessage({ready});
    })());
  }
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Do not intercept login, callbacks, API calls, external resources, or queries.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search) return;
  if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith((async () => {
      try {
        // Preserve online access checks. A login/403/redirect must reach the browser.
        return await fetch(request);
      } catch {
        const cached = await (await caches.open(CACHE_NAME)).match('/index.html');
        return cached || new Response('오프라인 준비가 필요해요. 인터넷에 연결한 뒤 하루를 다시 열어 주세요.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());
  } else if (allowed.has(url.pathname) && url.pathname !== '/index.html') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(url.pathname) || fetch(request);
    })());
  }
});
