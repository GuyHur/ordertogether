import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import Button from '../../components/Button/Button'
import '../auth.css'

export default function Register() {
    const { register } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        building: '',
    })
    const [buildings, setBuildings] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        api.get('/config')
            .then((cfg) => setBuildings(cfg.buildings || []))
            .catch(() => { })
    }, [])

    const update = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            await register(form.email, form.password, form.displayName, form.building)
            navigate('/')
        } catch (err) {
            setError(err.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-brand">OrderTogether</div>
                    <p className="auth-subtitle">Create your account to join group orders</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-name">Username</label>
                        <input
                            id="reg-name"
                            type="text"
                            className="form-input"
                            placeholder="Choose a username"
                            value={form.displayName}
                            onChange={update('displayName')}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">Email (optional)</label>
                        <input
                            id="reg-email"
                            type="email"
                            className="form-input"
                            placeholder="you@company.com"
                            value={form.email}
                            onChange={update('email')}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-building">Building (optional)</label>
                        <select
                            id="reg-building"
                            className="form-select"
                            value={form.building}
                            onChange={update('building')}
                        >
                            <option value="">Select a building</option>
                            {buildings.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            className="form-input"
                            placeholder="At least 6 characters"
                            value={form.password}
                            onChange={update('password')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={update('confirmPassword')}
                            required
                        />
                    </div>

                    <Button type="submit" variant="primary" block loading={loading}>
                        Create Account
                    </Button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    )
}
