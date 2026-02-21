import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const THEMES = [
    { id: 'midnight', label: 'Midnight', emoji: '🌙', description: 'Deep indigo dark' },
    { id: 'dark', label: 'Dark', emoji: '🖤', description: 'Pure black & grey' },
    { id: 'light', label: 'Light', emoji: '☀️', description: 'Clean and bright' },
    { id: 'sunset', label: 'Sunset', emoji: '🌅', description: 'Warm orange & purple' },
    { id: 'ocean', label: 'Ocean', emoji: '🌊', description: 'Deep sea cyan' },
    { id: 'forest', label: 'Forest', emoji: '🌲', description: 'Natural greens' },
]

const STORAGE_KEY = 'ot-theme'

const ThemeContext = createContext(undefined)

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) || 'midnight'
        } catch {
            return 'midnight'
        }
    })

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* noop */ }
    }, [theme])

    const setTheme = useCallback((id) => {
        if (THEMES.some((t) => t.id === id)) {
            setThemeState(id)
        }
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}

export { THEMES }
