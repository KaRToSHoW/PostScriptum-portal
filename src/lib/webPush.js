import { pushApi } from '../api/push'

export const pushSupported =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' && 'PushManager' in window

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

/** Регистрирует SW, подписывается на пуш и отправляет подписку на бэкенд. Идемпотентно. */
export async function subscribeToPush() {
  if (!pushSupported) return false
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const { key } = await pushApi.publicKey()
      if (!key) return false
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
    }
    const json = sub.toJSON()   // { endpoint, keys: { p256dh, auth } }
    await pushApi.subscribe({ endpoint: json.endpoint, keys: json.keys })
    return true
  } catch (e) {
    return false
  }
}

export async function unsubscribeFromPush() {
  if (!pushSupported) return
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = reg && (await reg.pushManager.getSubscription())
    if (sub) {
      await pushApi.unsubscribe(sub.endpoint).catch(() => {})
      await sub.unsubscribe().catch(() => {})
    }
  } catch (e) { /* ignore */ }
}
