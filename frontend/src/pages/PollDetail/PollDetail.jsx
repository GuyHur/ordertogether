import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Users, Building, Plus, MapPin, CheckCircle
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast/Toast'
import Button from '../../components/Button/Button'
import Avatar from '../../components/Avatar/Avatar'
import { getServiceIcon } from '../../utils/getIcon'
import '../auth.css'

export default function PollDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const { addToast } = useToast()
    const navigate = useNavigate()

    const [poll, setPoll] = useState(null)
    const [loading, setLoading] = useState(true)

    const loadPoll = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
        try {
            const data = await api.get(`/polls/${id}`)
            setPoll(data)
        } catch {
            if (showLoading) {
                addToast('Poll not found', 'error')
                navigate('/')
            }
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [id, addToast, navigate])

    useEffect(() => {
        loadPoll(true)
        const interval = setInterval(() => loadPoll(false), 3000)
        return () => clearInterval(interval)
    }, [loadPoll])

    const isCreator = user?.id === poll?.creator?.id

    // Derived state
    const hasVoted = poll?.votes.find(v => v.user_id === user?.id)

    // Count votes per option
    const optionVotes = poll ? poll.options.map(opt => ({
        ...opt,
        votes: poll.votes.filter(v => v.option_id === opt.id)
    })) : []

    const highestVotes = Math.max(...optionVotes.map(o => o.votes.length), 0)

    const handleVote = async (optionId) => {
        try {
            const data = await api.post(`/polls/${id}/vote`, { option_id: optionId })
            setPoll(data)
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const handleClosePoll = async () => {
        try {
            const data = await api.post(`/polls/${id}/close`)
            setPoll(data)
            addToast('Poll closed!', 'info')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    if (loading) return (
        <div className="detail-page">
            <div className="skeleton-card" style={{ height: 400 }} />
        </div>
    )
    if (!poll) return null

    return (
        <div className="detail-page">
            <Link to="/" className="detail-back">
                <ArrowLeft size={16} /> Back to dashboard
            </Link>

            <div className="detail-card">
                {/* Header */}
                <div className="detail-card-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <div>
                            <h1 className="detail-title">{poll.title}</h1>
                            <div className="detail-service-name" style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                {poll.building && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Building size={14} /> {poll.building}</span>}
                                {poll.destination && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {poll.destination}</span>}
                            </div>
                        </div>
                        <span className={`order-status ${poll.status === 'active' ? 'open' : 'delivered'}`}>
                            {poll.status === 'active' ? 'active poll' : 'closed'}
                        </span>
                    </div>
                </div>

                <div className="detail-body" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 className="section-title" style={{ margin: 0 }}>Voting Options</h3>
                        {poll.status === 'active' && isCreator && (
                            <Button variant="secondary" size="sm" onClick={handleClosePoll}>
                                Close Poll
                            </Button>
                        )}
                    </div>

                    <div className="poll-options-grid" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {optionVotes.map(opt => {
                            const isWinning = opt.votes.length === highestVotes && opt.votes.length > 0
                            const userVotedThis = hasVoted?.option_id === opt.id
                            const progressPercent = poll.votes.length > 0 ? (opt.votes.length / poll.votes.length) * 100 : 0

                            return (
                                <div
                                    key={opt.id}
                                    className={`poll-option-card ${userVotedThis ? 'voted' : ''}`}
                                    style={{
                                        position: "relative",
                                        padding: "16px",
                                        borderRadius: "var(--radius-md)",
                                        border: `1px solid ${userVotedThis ? 'var(--accent-primary)' : 'var(--border-card)'}`,
                                        background: "var(--bg-card)",
                                        overflow: "hidden",
                                        cursor: poll.status === 'active' ? 'pointer' : 'default',
                                        transition: "all 0.2s ease"
                                    }}
                                    onClick={() => poll.status === 'active' && handleVote(opt.id)}
                                >
                                    {/* Progress background */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0, top: 0, bottom: 0,
                                            width: `${progressPercent}%`,
                                            background: "var(--bg-card-hover)",
                                            zIndex: 0,
                                            transition: "width 0.4s ease"
                                        }}
                                    />

                                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            {opt.service && (
                                                <img
                                                    src={getServiceIcon(opt.service.icon_url)}
                                                    alt=""
                                                    style={{ width: 32, height: 32, borderRadius: 8 }}
                                                />
                                            )}
                                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "1.1rem" }}>
                                                {opt.service ? (opt.service.name_he || opt.service.name) : opt.text}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                            <div style={{ display: "flex" }}>
                                                {opt.votes.slice(0, 3).map((v, i) => (
                                                    <div key={v.id} style={{ marginLeft: i > 0 ? -8 : 0, borderRadius: "50%", border: "2px solid var(--bg-card)" }}>
                                                        <Avatar name={v.user.display_name} color={v.user.avatar_color} size={28} />
                                                    </div>
                                                ))}
                                                {opt.votes.length > 3 && (
                                                    <div style={{
                                                        marginLeft: -8, width: 28, height: 28, borderRadius: "50%",
                                                        background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: "10px", fontWeight: "bold", border: "2px solid var(--bg-card)"
                                                    }}>
                                                        +{(opt.votes.length - 3)}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ fontWeight: "bold", fontSize: "1.2rem", width: "40px", textAlign: "right" }}>
                                                {opt.votes.length}
                                            </div>
                                        </div>
                                    </div>

                                    {isWinning && poll.status === 'closed' && (
                                        <div style={{ position: "absolute", top: 8, right: 8, color: "var(--success)" }}>
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {poll.status === 'closed' && isCreator && (
                        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
                            <p style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>The poll is closed! Ready to start an order with the winning option?</p>
                            <Button variant="primary" onClick={() => {
                                const winner = optionVotes.reduce((prev, current) => (prev && prev.votes.length > current.votes.length) ? prev : current, null)
                                navigate('/create', {
                                    state: {
                                        service_id: winner?.service_id || '',
                                        title: poll.title,
                                        building: poll.building,
                                        destination: poll.destination
                                    }
                                })
                            }}>
                                <Plus size={16} /> Create Order from Poll
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
