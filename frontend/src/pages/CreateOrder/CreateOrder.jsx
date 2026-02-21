import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast/Toast'
import Button from '../../components/Button/Button'
import '../auth.css'
import './CreateOrder.css'

export default function CreateOrder() {
    const navigate = useNavigate()
    const { addToast } = useToast()

    const [services, setServices] = useState([])
    const [appConfig, setAppConfig] = useState({ buildings: [], food_tags: [] })
    const [form, setForm] = useState({
        service_id: '',
        title: '',
        description: '',
        destination: '',
        order_link: '',
        group_order_id: '',
        building: '',
        location_note: '',
        food_tags: [],
        deadline: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get('/services').then(setServices).catch(() => { })
        api.get('/config').then(setAppConfig).catch(() => { })
    }, [])

    const update = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const toggleTag = (tag) => {
        setForm((prev) => ({
            ...prev,
            food_tags: prev.food_tags.includes(tag)
                ? prev.food_tags.filter((t) => t !== tag)
                : [...prev.food_tags, tag],
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.service_id) {
            setError('Please select a delivery service')
            return
        }
        if (!form.title.trim()) {
            setError('Please enter a title')
            return
        }

        setError('')
        setLoading(true)
        try {
            const payload = {
                ...form,
                deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                description: form.description || null,
                destination: form.destination || null,
                order_link: form.order_link || null,
                group_order_id: form.group_order_id.trim().toUpperCase() || null,
                building: form.building || null,
                location_note: form.location_note || null,
                food_tags: form.food_tags.length > 0 ? form.food_tags : null,
            }
            const order = await api.post('/orders', payload)
            addToast('Order created! Share it with your team.', 'success')
            navigate(`/order/${order.id}`)
        } catch (err) {
            setError(err.message || 'Failed to create order')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="create-page">
            <h1 className="page-title">Create Group Order</h1>
            <p className="page-subtitle">Pick a service and invite your colleagues to join</p>

            <form className="create-form" onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}

                {/* Service picker */}
                <div className="form-group">
                    <label className="form-label">Delivery Service</label>
                    <div className="service-picker">
                        {services.map((svc) => (
                            <div
                                key={svc.id}
                                className={`service-option ${form.service_id === svc.id ? 'selected' : ''}`}
                                onClick={() => setForm((p) => ({ ...p, service_id: svc.id }))}
                            >
                                <img src={svc.icon_url} alt={svc.name} />
                                <span>{svc.name_he || svc.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div className="form-group">
                    <label className="form-label" htmlFor="order-title">Order Title</label>
                    <input
                        id="order-title"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Lunch from Wolt — Building A"
                        value={form.title}
                        onChange={update('title')}
                        required
                    />
                </div>

                {/* Description */}
                <div className="form-group">
                    <label className="form-label" htmlFor="order-desc">Description (optional)</label>
                    <textarea
                        id="order-desc"
                        className="form-textarea"
                        placeholder="Any details about the order..."
                        value={form.description}
                        onChange={update('description')}
                        rows={3}
                    />
                </div>

                {/* Food tags */}
                {appConfig.food_tags.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">Food Tags</label>
                        <div className="tag-picker">
                            {appConfig.food_tags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`tag-chip ${form.food_tags.includes(tag) ? 'active' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Building + Location note */}
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="order-building">Building</label>
                        <select
                            id="order-building"
                            className="form-select"
                            value={form.building}
                            onChange={update('building')}
                        >
                            <option value="">Select building...</option>
                            {appConfig.buildings.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="order-location">Location Note</label>
                        <input
                            id="order-location"
                            type="text"
                            className="form-input"
                            placeholder="Room 3, Lobby A..."
                            value={form.location_note}
                            onChange={update('location_note')}
                        />
                    </div>
                </div>

                <div className="form-row">
                    {/* Destination */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="order-dest">Destination</label>
                        <input
                            id="order-dest"
                            type="text"
                            className="form-input"
                            placeholder="Restaurant or address"
                            value={form.destination}
                            onChange={update('destination')}
                        />
                    </div>

                    {/* Deadline */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="order-deadline">Deadline</label>
                        <input
                            id="order-deadline"
                            type="datetime-local"
                            className="form-input"
                            value={form.deadline}
                            onChange={update('deadline')}
                        />
                    </div>
                </div>

                {/* External link */}
                <div className="form-group">
                    <label className="form-label" htmlFor="order-link">Shared Cart Link (optional)</label>
                    <input
                        id="order-link"
                        type="url"
                        className="form-input"
                        placeholder="https://wolt.com/group/..."
                        value={form.order_link}
                        onChange={update('order_link')}
                    />
                </div>

                {/* Group Order ID for QR — only for Wolt */}
                {services.find((s) => s.id === form.service_id)?.name?.toLowerCase() === 'wolt' && (
                    <div className="form-group">
                        <label className="form-label" htmlFor="order-group-id">Wolt Group Order ID (for QR code)</label>
                        <input
                            id="order-group-id"
                            type="text"
                            className="form-input"
                            placeholder="e.g. 7PNCEZM9"
                            value={form.group_order_id}
                            onChange={update('group_order_id')}
                            style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                        />
                    </div>
                )}

                <Button type="submit" variant="primary" block size="lg" loading={loading}>
                    Create Order
                </Button>
            </form>
        </div>
    )
}
