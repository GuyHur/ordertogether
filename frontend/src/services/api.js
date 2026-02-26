/* ════════════════════════════════════════════════════════════════════════════
   API client — centralised fetch wrappers with JWT auth
   ════════════════════════════════════════════════════════════════════════════ */

const API_BASE = '/api'

async function request(path, options = {}) {
    const token = localStorage.getItem('access_token')

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

    /* ── Token refresh on 401 ──────────────────────────────────────────── */
    if (res.status === 401 && token) {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            })

            if (refreshRes.ok) {
                const data = await refreshRes.json()
                localStorage.setItem('access_token', data.access_token)
                localStorage.setItem('refresh_token', data.refresh_token)

                // Retry original request with new token
                headers.Authorization = `Bearer ${data.access_token}`
                const retry = await fetch(`${API_BASE}${path}`, { ...options, headers })
                if (!retry.ok) {
                    const err = await retry.json().catch(() => ({}))
                    throw new Error(err.detail || retry.statusText)
                }
                return retry.json()
            } else {
                // Refresh failed — clear tokens
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                window.location.href = '/login'
                throw new Error('Session expired')
            }
        }
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || res.statusText)
    }

    // Handle 204 No Content
    if (res.status === 204) return null
    return res.json()
}

export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: 'DELETE' }),
    upload: async (path, formData) => {
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
            body: formData,
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.detail || res.statusText)
        }
        if (res.status === 204) return null
        return res.json()
    },
}
