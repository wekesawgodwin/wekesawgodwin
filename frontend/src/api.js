const TOKEN_KEY = 'wg_admin_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable (private mode); the session just won't persist */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function errorMessage(body, status) {
  const detail = body && body.detail
  if (typeof detail === 'string') return detail
  // FastAPI validation errors: [{loc: [...], msg: '...'}]
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((d) => {
        const field = d.loc && d.loc[d.loc.length - 1]
        return field && field !== 'body' ? `${field}: ${d.msg}` : d.msg
      })
      .join('\n')
  }
  if (status === 429) return 'Too many requests, please try again later.'
  return `Request failed (${status})`
}

export async function api(path, { method = 'GET', body, auth = false, form } = {}) {
  const headers = {}
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(path, { method, headers, body: payload })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && auth) {
      setToken(null)
      window.dispatchEvent(new Event('wg-logout'))
    }
    throw new ApiError(errorMessage(data, res.status), res.status)
  }
  return data
}

export const adminApi = {
  get: (path) => api(`/api/admin${path}`, { auth: true }),
  post: (path, body) => api(`/api/admin${path}`, { method: 'POST', body, auth: true }),
  put: (path, body) => api(`/api/admin${path}`, { method: 'PUT', body, auth: true }),
  patch: (path, body) => api(`/api/admin${path}`, { method: 'PATCH', body, auth: true }),
  del: (path) => api(`/api/admin${path}`, { method: 'DELETE', auth: true }),
  upload: (path, file) => {
    const form = new FormData()
    form.append('file', file)
    return api(`/api/admin${path}`, { method: 'POST', form, auth: true })
  },
}
