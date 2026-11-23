/*
 * Tawasol demo service worker — static assets only.
 *
 * It is intentionally NOT registered by the app. It does not provide offline
 * support, does not intercept navigation or API requests, and never caches
 * responses from the network. Only the small static assets listed below are
 * cached at install time, and those are served from cache when present.
 */
const CACHE_NAME = 'tawasol-static-v1'
const STATIC_ASSETS = ['/icons/icon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') return

  // Only pre-cached static resources are handled. Everything else goes to the network.
  const staticDestinations = ['style', 'script', 'image', 'font', 'manifest']
  if (!staticDestinations.includes(request.destination)) return

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  )
})
