const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

/** Загружает файл через multipart. purpose: AVATAR|HOMEWORK|MATERIAL|MESSAGE */
export async function uploadFile(file, purpose = 'GENERAL') {
  const token = localStorage.getItem('ps_token')
  const form = new FormData()
  form.append('file', file)
  form.append('purpose', purpose)

  const res = await fetch(`${BASE}/api/files`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) throw new Error('Не удалось загрузить файл')
  return res.json()   // { id, url, name, size }
}

/** Полный URL для отдачи файла (для img src / ссылок) */
export function fileUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${BASE}${url}`
}
