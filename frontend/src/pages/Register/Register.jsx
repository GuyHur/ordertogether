import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
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
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
                        <span className="form-hint">This is what you'll use to sign in</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            type="email"
                            className="form-input"
                            placeholder="you@company.com"
                            value={form.email}
                            onChange={update('email')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-building">Building (optional)</label>
                        <input
                            id="reg-building"
                            type="text"
                            className="form-input"
                            placeholder="e.g. Building A, Floor 3"
                            value={form.building}
                            onChange={update('building')}
                        />
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
