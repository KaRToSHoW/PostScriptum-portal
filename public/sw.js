/* Service Worker для Web Push — показывает уведомления даже при закрытом сайте. */

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} }
  catch (e) { data = { body: event.data ? event.data.text() : '' } }

  const title = data.title || 'Post Scriptum'
  const options = {
    body: data.body || '',
    icon: '/ps-logo.jpg',
    badge: '/ps-logo.jpg',
    data: { url: data.url || '/' },
    tag: data.tag,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) {
          c.focus()
          if (c.navigate) { try { c.navigate(url) } catch (e) { /* ignore */ } }
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
