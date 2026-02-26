import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Building, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../services/api'
import Button from '../../components/Button/Button'
import EmptyState from '../../components/EmptyState/EmptyState'
import '../auth.css'
import './Polls.css'

export default function Polls() {
    const [polls, setPolls] = useState([])
    const [loading, setLoading] = useState(true)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const POLLS_PER_PAGE = 6

    useEffect(() => {
        loadPolls(true)
        const interval = setInterval(() => loadPolls(false), 5000)
        return () => clearInterval(interval)
    }, [currentPage])

    const totalPages = Math.ceil(polls.length / POLLS_PER_PAGE)
    const paginatedPolls = useMemo(() => {
        const start = (currentPage - 1) * POLLS_PER_PAGE
        return polls.slice(start, start + POLLS_PER_PAGE)
    }, [polls, currentPage])

    async function loadPolls(showLoading = true) {
        if (showLoading) setLoading(true)
        try {
            const data = await api.get('/polls')
            setPolls(data)
        } catch { /* noop */ }
        finally {
            if (showLoading) setLoading(false)
        }
    }

    return (
        <div className="polls-page">
            <div className="polls-header">
                <div>
                    <h1 className="polls-title">Active Polls</h1>
                    <p className="polls-subtitle">Vote on what to order today</p>
                </div>
                <Link to="/create-poll">
                    <Button variant="primary">
                        <Plus size={18} />
                        New Poll
                    </Button>
                </Link>
            </div>

            <div className="polls-grid-container">
                {loading ? (
                    <div className="polls-grid">
                        {[1, 2, 3].map((i) => <div key={i} className="skeleton-card" />)}
                    </div>
                ) : polls.length === 0 ? (
                    <EmptyState
                        icon={<BarChart size={36} />}
                        title="No active polls"
                        description="Be the first to ask your team where they want to eat!"
                    />
                ) : (
                    <>
                        <div className="polls-grid">
                            {paginatedPolls.map((poll) => (
                                <Link key={poll.id} to={`/poll/${poll.id}`} className="poll-card-link">
                                    <div className="poll-card">
                                        <div className="poll-card-header">
                                            <h3 className="poll-card-title">{poll.title}</h3>
                                            <span className="poll-status">open</span>
                                        </div>
                                        <div className="poll-card-meta">
                                            <div className="poll-meta-item">
                                                <Building size={14} />
                                                <span>{poll.building || 'Any building'}</span>
                                            </div>
                                            {poll.destination && (
                                                <div className="poll-meta-item">
                                                    <MapPin size={14} />
                                                    <span>{poll.destination}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="poll-card-footer">
                                            <div className="poll-votes-count">
                                                {poll.votes.length} {poll.votes.length === 1 ? 'vote' : 'votes'}
                                            </div>
                                            <div className="poll-creator">
                                                by {poll.creator?.display_name}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} /> Prev
                                </Button>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next <ChevronRight size={16} />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
