import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast/Toast'
import { api } from '../../services/api'
import Button from '../../components/Button/Button'
import '../auth.css'
import './Profile.css'

const AVATAR_COLORS = [
    '#63b3ed', '#68d391', '#f6ad55', '#fc8181', '#b794f4',
    '#f687b3', '#4fd1c5', '#ecc94b', '#9f7aea', '#ed8936',
]

export default function Profile() {
    const { user, updateProfile } = useAuth()
    const { addToast } = useToast()

    const [form, setForm] = useState({
        display_name: user?.display_name || '',
        building: user?.building || '',
        avatar_color: user?.avatar_color || '#63b3ed',
    })
    const [buildings, setBuildings] = useState([])
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
        setLoading(true)
        try {
            await updateProfile(form)
            addToast('Profile updated!', 'success')
        } catch (err) {
            addToast(err.message || 'Update failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    const initials = form.display_name
        ?.split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'

    return (
        <div className="profile-page">
            <h1 className="page-title">Profile</h1>
            <p className="page-subtitle">Manage your account settings</p>

            <div className="profile-card">
                <div className="profile-avatar-section">
                    <div
                        className="profile-avatar-large"
                        style={{ backgroundColor: form.avatar_color }}
                    >
                        {initials}
                    </div>
                    <div className="profile-avatar-info">
                        <div className="profile-avatar-name">{form.display_name || 'Your Name'}</div>
                        <div className="profile-avatar-email">{user?.email}</div>
                    </div>
                </div>

                <form className="profile-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-name">Display Name</label>
                        <input
                            id="profile-name"
                            type="text"
                            className="form-input"
                            value={form.display_name}
                            onChange={update('display_name')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-building">Building</label>
                        <select
                            id="profile-building"
                            className="form-select"
                            value={form.building}
                            onChange={update('building')}
                        >
                            <option value="">No building selected</option>
                            {buildings.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Avatar Colour</label>
                        <div className="color-picker">
                            {AVATAR_COLORS.map((color) => (
                                <div
                                    key={color}
                                    className={`color-swatch ${form.avatar_color === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setForm((p) => ({ ...p, avatar_color: color }))}
                                />
                            ))}
                        </div>
                    </div>

                    <Button type="submit" variant="primary" block loading={loading}>
                        Save Changes
                    </Button>
                </form>
            </div>
        </div>
    )
}
