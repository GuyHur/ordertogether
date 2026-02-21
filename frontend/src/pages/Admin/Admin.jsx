import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Trash2, Building, Tag, Truck, Users, Shield, ShieldOff, Activity } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast/Toast'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../../components/Avatar/Avatar'
import Button from '../../components/Button/Button'
import './Admin.css'

export default function Admin() {
    const { user } = useAuth()
    const { addToast } = useToast()
    const [buildings, setBuildings] = useState([])
    const [foodTags, setFoodTags] = useState([])
    const [services, setServices] = useState([])
    const [users, setUsers] = useState([])
    const [newBuilding, setNewBuilding] = useState('')
    const [newTag, setNewTag] = useState('')
    const [newService, setNewService] = useState({ name: '', name_he: '', icon_url: '/api/icons/default.png' })
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const reqs = [
                api.get('/admin/buildings'),
                api.get('/admin/food-tags'),
                api.get('/admin/services'),
            ]
            if (user?.is_superuser) {
                reqs.push(api.get('/admin/users'))
            }

            const results = await Promise.all(reqs)
            setBuildings(results[0])
            setFoodTags(results[1])
            setServices(results[2])
            if (results[3]) setUsers(results[3])
        } catch (err) {
            addToast(err.message, 'error')
        } finally {
            setLoading(false)
        }
    }, [addToast])

    useEffect(() => { load() }, [load])

    const addBuilding = async (e) => {
        e.preventDefault()
        if (!newBuilding.trim()) return
        try {
            const data = await api.post('/admin/buildings', { name: newBuilding.trim() })
            setBuildings(data.buildings)
            setNewBuilding('')
            addToast('Building added', 'success')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const removeBuilding = async (name) => {
        try {
            await api.delete(`/admin/buildings/${encodeURIComponent(name)}`)
            setBuildings(prev => prev.filter(b => b !== name))
            addToast('Building removed', 'info')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const addTag = async (e) => {
        e.preventDefault()
        if (!newTag.trim()) return
        try {
            const data = await api.post('/admin/food-tags', { name: newTag.trim() })
            setFoodTags(data.food_tags)
            setNewTag('')
            addToast('Tag added', 'success')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const removeTag = async (name) => {
        try {
            await api.delete(`/admin/food-tags/${encodeURIComponent(name)}`)
            setFoodTags(prev => prev.filter(t => t !== name))
            addToast('Tag removed', 'info')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const addService = async (e) => {
        e.preventDefault()
        if (!newService.name.trim()) return
        try {
            await api.post('/admin/services', newService)
            setNewService({ name: '', name_he: '', icon_url: '/api/icons/default.png' })
            addToast('Service added', 'success')
            await load()
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const removeService = async (id) => {
        try {
            await api.delete(`/admin/services/${id}`)
            setServices(prev => prev.filter(s => s.id !== id))
            addToast('Service removed', 'info')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const toggleAdmin = async (userId, currentlyAdmin) => {
        try {
            const endpoint = currentlyAdmin ? 'demote' : 'promote'
            const updatedUser = await api.put(`/admin/users/${userId}/${endpoint}`)
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u))
            addToast(`User ${currentlyAdmin ? 'demoted' : 'promoted'}`, 'success')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    if (loading) return <div className="admin-page"><div className="skeleton-card" style={{ height: 300 }} /></div>

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Admin Dashboard</h1>
                <Link to="/admin/bi" className="btn btn-primary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Activity size={18} /> BI Dashboard
                </Link>
            </div>

            {/* Users (Superuser Only) */}
            {user?.is_superuser && (
                <section className="admin-section">
                    <h2 className="admin-section-title"><Users size={18} /> User Management</h2>
                    <div className="admin-list">
                        {users.map(u => (
                            <div key={u.id} className="admin-list-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Avatar user={u} className="navbar-avatar" style={{ width: 32, height: 32, fontSize: 14 }} />
                                    <div>
                                        <div style={{ fontWeight: 500 }}>
                                            {u.display_name}
                                            {u.is_superuser && <span className="admin-tag-chip" style={{ marginLeft: 8, padding: '2px 6px' }}>Superuser</span>}
                                            {u.is_admin && !u.is_superuser && <span className="admin-tag-chip" style={{ marginLeft: 8, padding: '2px 6px', background: 'rgba(56, 161, 105, 0.1)', color: '#38a169' }}>Admin</span>}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email || 'No email'}</div>
                                    </div>
                                </div>
                                {!u.is_superuser && (
                                    <Button
                                        variant={u.is_admin ? "secondary" : "primary"}
                                        size="sm"
                                        onClick={() => toggleAdmin(u.id, u.is_admin)}
                                    >
                                        {u.is_admin ? <><ShieldOff size={14} /> Demote</> : <><Shield size={14} /> Promote</>}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Buildings */}
            <section className="admin-section">
                <h2 className="admin-section-title"><Building size={18} /> Buildings</h2>
                <div className="admin-list">
                    {buildings.map(b => (
                        <div key={b} className="admin-list-item">
                            <span>{b}</span>
                            <button className="admin-remove-btn" onClick={() => removeBuilding(b)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <form className="admin-add-form" onSubmit={addBuilding}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="New building name"
                        value={newBuilding}
                        onChange={(e) => setNewBuilding(e.target.value)}
                    />
                    <Button type="submit" variant="primary" size="sm"><PlusCircle size={14} /> Add</Button>
                </form>
            </section>

            {/* Food Tags */}
            <section className="admin-section">
                <h2 className="admin-section-title"><Tag size={18} /> Food Tags</h2>
                <div className="admin-tags">
                    {foodTags.map(t => (
                        <div key={t} className="admin-tag-chip">
                            {t}
                            <button className="tag-remove" onClick={() => removeTag(t)}>×</button>
                        </div>
                    ))}
                </div>
                <form className="admin-add-form" onSubmit={addTag}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="New tag name"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                    />
                    <Button type="submit" variant="primary" size="sm"><PlusCircle size={14} /> Add</Button>
                </form>
            </section>

            {/* Delivery Services */}
            <section className="admin-section">
                <h2 className="admin-section-title"><Truck size={18} /> Delivery Services</h2>
                <div className="admin-list">
                    {services.map(s => (
                        <div key={s.id} className="admin-list-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {s.icon_url && <img src={s.icon_url} alt="" className="admin-service-icon" />}
                                <div>
                                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                                    {s.name_he && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.name_he}</div>}
                                </div>
                            </div>
                            <button className="admin-remove-btn" onClick={() => removeService(s.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <form className="admin-add-form" onSubmit={addService}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Service name"
                        value={newService.name}
                        onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Hebrew name (optional)"
                        value={newService.name_he}
                        onChange={(e) => setNewService(prev => ({ ...prev, name_he: e.target.value }))}
                    />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Icon URL"
                        value={newService.icon_url}
                        onChange={(e) => setNewService(prev => ({ ...prev, icon_url: e.target.value }))}
                    />
                    <Button type="submit" variant="primary" size="sm"><PlusCircle size={14} /> Add</Button>
                </form>
            </section>
        </div>
    )
}
