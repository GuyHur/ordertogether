import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import './Toast.css'

const ToastContext = createContext(null)

let toastId = 0

const ICONS = {
    success: <CheckCircle size={18} color="var(--accent-success)" />,
    error: <XCircle size={18} color="var(--accent-danger)" />,
    info: <Info size={18} color="var(--accent-primary)" />,
    warning: <AlertTriangle size={18} color="var(--accent-warning)" />,
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId
        setToasts((prev) => [...prev, { id, message, type }])

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
                )
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== id))
                }, 260)
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
        )
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 260)
    }, [])

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast ${t.type} ${t.leaving ? 'leaving' : ''}`}>
                        <span className="toast-icon">{ICONS[t.type]}</span>
                        <span className="toast-message">{t.message}</span>
                        <button className="toast-close" onClick={() => removeToast(t.id)}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside ToastProvider')
    return ctx
}
