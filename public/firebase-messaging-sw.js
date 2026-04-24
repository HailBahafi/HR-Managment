/* No-op worker: browsers/extensions may request this path; avoids routing it through Next.js. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
