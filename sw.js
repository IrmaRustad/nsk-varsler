// Service worker for Nettskred-varsler.
// Viser innkommende Web Push som systemvarsel og aapner varslingssiden ved trykk.

self.addEventListener('install', (e) => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let d = {}
  try { d = event.data ? event.data.json() : {} } catch { d = { title: 'Nettskred', body: event.data ? event.data.text() : '' } }

  const tittel = d.title || 'Nettskred'
  const kritisk = d.level === 'critical'
  const opp = {
    body: d.body || '',
    icon: 'ikon.png',
    badge: 'ikon.png',
    tag: d.tag || `nsk-${d.source || 'varsel'}`,
    renotify: true,
    requireInteraction: kritisk,
    vibrate: kritisk ? [200, 100, 200, 100, 200] : [120],
    data: { url: d.url || '/', level: d.level || 'info', sentAt: d.sentAt || null },
  }
  event.waitUntil(self.registration.showNotification(tittel, opp))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const maal = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((liste) => {
      for (const k of liste) {
        if ('focus' in k) { k.navigate(maal); return k.focus() }
      }
      return self.clients.openWindow(maal)
    })
  )
})
