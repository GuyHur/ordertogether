import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    /* ── Bootstrap: check for existing token ──────────────────────────── */
    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            api.get('/auth/me')
                .then(setUser)
                .catch(() => {
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')
                })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

    /* ── Login ─────────────────────────────────────────────────────────── */
    const login = useCallback(async (email, password) => {
        const data = await api.post('/auth/login', { email, password })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        const profile = await api.get('/auth/me')
        setUser(profile)
        return profile
    }, [])

    /* ── Register ──────────────────────────────────────────────────────── */
    const register = useCallback(async (email, password, displayName, building) => {
        const data = await api.post('/auth/register', {
            email,
            password,
            display_name: displayName,
            building: building || null,
        })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        const profile = await api.get('/auth/me')
        setUser(profile)
        return profile
    }, [])

    /* ── Logout ────────────────────────────────────────────────────────── */
    const logout = useCallback(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
    }, [])

    /* ── Update profile ────────────────────────────────────────────────── */
    const updateProfile = useCallback(async (updates) => {
        const updated = await api.put('/users/me', updates)
        setUser(updated)
        return updated
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
