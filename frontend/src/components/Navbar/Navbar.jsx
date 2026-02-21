import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, ClipboardList, User, LogOut, Palette, Bell, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import './Navbar.css'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { theme, setTheme, themes } = useTheme()
    const [showMenu, setShowMenu] = useState(false)
    const [showNotifs, setShowNotifs] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const menuRef = useRef(null)
    const notifRef = useRef(null)
    const navigate = useNavigate()

    /* Poll unread count */
    useEffect(() => {
        const poll = () => api.get('/notifications/count').then(d => setUnreadCount(d.unread)).catch(() => { })
        poll()
        const interval = setInterval(poll, 10000)
        return () => clearInterval(interval)
    }, [])

    const loadNotifications = useCallback(async () => {
        try {
            const data = await api.get('/notifications')
            setNotifications(data)
        } catch { /* noop */ }
    }, [])

    const handleBellClick = () => {
        const next = !showNotifs
        setShowNotifs(next)
        setShowMenu(false)
        if (next) loadNotifications()
    }

    const handleMarkAllRead = async () => {
        await api.post('/notifications/read-all').catch(() => { })
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }

    const handleNotifClick = (notif) => {
        if (notif.order_id) navigate(`/order/${notif.order_id}`)
        setShowNotifs(false)
    }

    /* Close dropdown on outside click */
    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false)
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifs(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const handleLogout = () => {
        logout()
        setShowMenu(false)
        navigate('/login')
    }

    const initials = user?.display_name
        ?.split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <span className="navbar-logo">OT</span>
            </Link>

            <div className="navbar-nav">
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Home size={18} />
                    <span>Orders</span>
                </NavLink>
                <NavLink to="/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <PlusCircle size={18} />
                    <span>New Order</span>
                </NavLink>
                <NavLink to="/my-orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <ClipboardList size={18} />
                    <span>My Orders</span>
                </NavLink>
            </div>

            <div className="navbar-actions">
                {/* Notification bell */}
                <div className="navbar-notif-wrapper" ref={notifRef}>
                    <button className="navbar-bell" onClick={handleBellClick}>
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>
                    {showNotifs && (
                        <div className="notif-dropdown">
                            <div className="notif-header">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <button className="notif-mark-all" onClick={handleMarkAllRead}>Mark all read</button>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <div className="notif-empty">No notifications yet</div>
                            ) : (
                                <div className="notif-list">
                                    {notifications.slice(0, 20).map(n => (
                                        <div
                                            key={n.id}
                                            className={`notif-item ${n.is_read ? '' : 'unread'}`}
                                            onClick={() => handleNotifClick(n)}
                                        >
                                            <div className="notif-message">{n.message}</div>
                                            <div className="notif-time">
                                                {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Admin link */}
                {user?.is_admin && (
                    <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex' }}>
                        <Settings size={18} />
                    </NavLink>
                )}
                <div className="navbar-user-menu" ref={menuRef}>
                    <div
                        className="navbar-avatar"
                        style={{ backgroundColor: user?.avatar_color || 'var(--accent-primary)' }}
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        {initials}
                    </div>

                    {showMenu && (
                        <div className="user-dropdown">
                            <div className="dropdown-user-info">
                                <div className="dropdown-user-name">{user?.display_name}</div>
                                <div className="dropdown-user-email">{user?.email}</div>
                            </div>
                            <div className="dropdown-divider" />

                            {/* Theme picker */}
                            <div className="dropdown-section-label">
                                <Palette size={13} />
                                Theme
                            </div>
                            <div className="theme-picker">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        className={`theme-option ${theme === t.id ? 'active' : ''}`}
                                        onClick={() => setTheme(t.id)}
                                        title={t.description}
                                    >
                                        <span className="theme-emoji">{t.emoji}</span>
                                        <span className="theme-label">{t.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="dropdown-divider" />
                            <Link
                                to="/profile"
                                className="dropdown-item"
                                onClick={() => setShowMenu(false)}
                            >
                                <User size={15} />
                                Profile
                            </Link>
                            <button className="dropdown-item danger" onClick={handleLogout}>
                                <LogOut size={15} />
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
