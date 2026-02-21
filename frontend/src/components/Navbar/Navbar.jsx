import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, ClipboardList, User, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
    const { user, logout } = useAuth()
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)
    const navigate = useNavigate()

    /* Close dropdown on outside click */
    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false)
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
                <div className="navbar-user-menu" ref={menuRef}>
                    <div
                        className="navbar-avatar"
                        style={{ backgroundColor: user?.avatar_color || '#63b3ed' }}
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
