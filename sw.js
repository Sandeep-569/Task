const CACHE_NAME = 'taskflow-v1';
const ASSETS = [
  '/Task/task_planner.html',
  '/Task/manifest.json',
  '/Task/icon-192.png',
  '/Task/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Epilogue:wght@400;500;600&display=swap',
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', e => {
  // Skip Firebase/Google requests — always need network
  if (
    e.request.url.includes('firebase') ||
    e.request.url.includes('googleapis') ||
    e.request.url.includes('gstatic') ||
    e.request.url.includes('firestore')
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache new requests dynamically
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return main page
        return caches.match('/Task/task_planner.html');
      });
    })
  );
});
