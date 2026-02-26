import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast/Toast'
import Button from '../../components/Button/Button'
import '../auth.css'
import './CreatePoll.css'

export default function CreatePoll() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToast } = useToast()

    const [services, setServices] = useState([])
    const [appConfig, setAppConfig] = useState({ buildings: [], food_tags: [] })

    // Multiple services can be selected
    const [selectedServices, setSelectedServices] = useState([])
    const [customOptions, setCustomOptions] = useState([''])

    const [form, setForm] = useState({
        title: '',
        building: user?.building || '',
        destination: '',
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get('/services').then(setServices).catch(() => { })
        api.get('/config').then(setAppConfig).catch(() => { })
    }, [])

    const update = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const toggleService = (svcId) => {
        setSelectedServices(prev =>
            prev.includes(svcId) ? prev.filter(id => id !== svcId) : [...prev, svcId]
        )
    }

    const handleCustomOptionChange = (idx, val) => {
        const newOpts = [...customOptions]
        newOpts[idx] = val
        setCustomOptions(newOpts)
    }

    const addCustomOption = () => {
        setCustomOptions([...customOptions, ''])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validCustoms = customOptions.filter(opt => opt.trim() !== '')
        if (selectedServices.length === 0 && validCustoms.length === 0) {
            setError('Please pick at least one service or enter a custom option to vote on')
            return
        }
        if (!form.title.trim()) {
            setError('Please enter a poll title')
            return
        }

        setError('')
        setLoading(true)

        try {
            const options = [
                ...selectedServices.map(id => ({ service_id: id })),
                ...validCustoms.map(text => ({ text }))
            ]

            const payload = {
                title: form.title,
                building: form.building || null,
                destination: form.destination || null,
                options
            }

            const poll = await api.post('/polls', payload)
            addToast('Poll created! Invite your team to vote.', 'success')
            navigate(`/poll/${poll.id}`)
        } catch (err) {
            setError(err.message || 'Failed to create poll')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="create-page">
            <h1 className="page-title">Where should we eat?</h1>
            <p className="page-subtitle">Create a poll to let your team vote on delivery options</p>

            <form className="create-form" onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}

                {/* Title */}
                <div className="form-group">
                    <label className="form-label" htmlFor="poll-title">Poll Title</label>
                    <input
                        id="poll-title"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Wednesday Team Lunch"
                        value={form.title}
                        onChange={update('title')}
                        required
                    />
                </div>

                {/* Service picker */}
                <div className="form-group">
                    <label className="form-label">Select Delivery Services (Optional)</label>
                    <div className="service-picker">
                        {services.map((svc) => (
                            <div
                                key={svc.id}
                                className={`service-option ${selectedServices.includes(svc.id) ? 'selected' : ''}`}
                                onClick={() => toggleService(svc.id)}
                            >
                                <img src={svc.icon_url} alt={svc.name} />
                                <span>{svc.name_he || svc.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Options */}
                <div className="form-group">
                    <label className="form-label">Custom Voting Options (e.g. "Pizza", "Sushi")</label>
                    {customOptions.map((opt, idx) => (
                        <input
                            key={idx}
                            type="text"
                            className="form-input"
                            placeholder="Add an option..."
                            value={opt}
                            onChange={(e) => handleCustomOptionChange(idx, e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={addCustomOption}>
                        + Add another option
                    </Button>
                </div>

                {/* Building + Destination */}
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="poll-building">Building</label>
                        <select
                            id="poll-building"
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
                        <label className="form-label" htmlFor="poll-dest">Destination Area (Optional)</label>
                        <input
                            id="poll-dest"
                            type="text"
                            className="form-input"
                            placeholder="E.g. Dizengoff, TLV"
                            value={form.destination}
                            onChange={update('destination')}
                        />
                    </div>
                </div>

                <Button type="submit" variant="primary" block size="lg" loading={loading} style={{ marginTop: '24px' }}>
                    Publish Poll
                </Button>
            </form>
        </div>
    )
}
