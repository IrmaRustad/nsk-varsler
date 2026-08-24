// Service worker for Nettskred-varsler. v3 — med mottakslogg for feilsoeking.
const LOGG = 'nsk-varsellogg'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

async function skrivLogg(tekst) {
  try {
    const c = await caches.open(LOGG)
    await c.put('/siste', new Response(JSON.stringify({ tid: new Date().toISOString(), tekst })))
  } catch (e) { /* loggen er hjelp, ikke krav */ }
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let d = {}
    let raatekst = ''
    try {
      raatekst = event.data ? event.data.text() : '(ingen data)'
      d = event.data ? event.data.json() : {}
    } catch { d = { title: 'Nettskred', body: raatekst } }

    await skrivLogg('push mottatt: ' + raatekst.slice(0, 120))

    const tittel = d.title || 'Nettskred'
    try {
      await self.registration.showNotification(tittel, {
        body: d.body || '',
        icon: 'ikon.png',
        badge: 'ikon.png',
        tag: d.tag || 'nsk-varsel',
        renotify: true,
        data: { url: d.url || './', level: d.level || 'info' },
      })
    } catch (e) {
      // Faller tilbake til det aller enkleste hvis noe i opsjonene feiler
      await skrivLogg('showNotification feilet: ' + e.message)
      await self.registration.showNotification(tittel, { body: d.body || '' })
    }
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const maal = (event.notification.data && event.notification.data.url) || './'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((liste) => {
      for (const k of liste) if ('focus' in k) { k.navigate(maal); return k.focus() }
      return self.clients.openWindow(maal)
    })
  )
})
