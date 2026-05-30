/** Декодирует JWT из localStorage и возвращает email текущего пользователя (claim sub). */
export function currentEmail() {
  const token = localStorage.getItem('ps_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.sub ?? null
  } catch {
    return null
  }
}
