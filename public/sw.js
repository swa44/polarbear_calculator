/**
 * 폴라베어 자동계산기 서비스 워커
 * - 빌드 파일(/_next/static)·이미지: 한 번 받으면 저장해 두고 바로 사용 (다시 열 때 빠르게)
 * - 페이지: 항상 서버에서 새로 받음 (가격이 바뀔 수 있으므로). 인터넷이 끊겼을 때만 저장본을 보여줌
 * - 다른 주소(자사몰·Supabase 등)는 건드리지 않음
 */
const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  url.pathname.includes("/_next/static/") || /\.(?:png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        // 빌드 파일은 이름에 해시가 있어 바뀌지 않음. 이미지는 저장본을 먼저 보여주고 뒤에서 새로 받아둔다
        if (hit && url.pathname.includes("/_next/static/")) return hit;
        const update = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        });
        if (hit) {
          event.waitUntil(update.catch(() => {}));
          return hit;
        }
        return update;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const hit = await caches.match(req);
          if (hit) return hit;
          return new Response(
            '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
              '<body style="font-family:-apple-system,sans-serif;text-align:center;padding:80px 20px;color:#111">' +
              "<h2>인터넷에 연결되어 있지 않습니다</h2><p style=\"color:#6b7280\">연결을 확인한 뒤 다시 시도해주세요.</p></body>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }),
    );
  }
});
