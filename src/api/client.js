const BASE = import.meta.env.VITE_API_URL ?? ''

function getToken() {
  return localStorage.getItem('ps_token')
}

async function request(path, options = {}) {
  const token = getToken()

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('ps_token')
    localStorage.removeItem('ps_role')
    // Не редиректим, если уже на странице логина (иначе сотрёт сообщение об ошибке)
    if (window.location.pathname !== '/login') {
      window.location.replace('/login')
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.message ?? `HTTP ${res.status}`)
    err.status = res.status
    err.body = body        // чтобы вызывающий код мог прочитать детали (например, blockers)
    throw err
  }

  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
}
