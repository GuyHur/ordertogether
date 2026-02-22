import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, ShoppingBag, Search, Sparkles, Activity, BarChart, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../services/api'
import OrderCard from '../../components/OrderCard/OrderCard'
import EmptyState from '../../components/EmptyState/EmptyState'
import Button from '../../components/Button/Button'
import { useToast } from '../../components/Toast/Toast'
import './Home.css'

const STATUS_FILTERS = [
    { label: 'All', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Invite Only', value: 'invite_only' },
    { label: 'Locked', value: 'locked' },
    { label: 'Ordered', value: 'ordered' },
    { label: 'Delivered', value: 'delivered' },
]

export default function Home() {
    const navigate = useNavigate()
    const { addToast } = useToast()
    const [orders, setOrders] = useState([])
    const [polls, setPolls] = useState([])
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [searchText, setSearchText] = useState('')
    const [buildingFilter, setBuildingFilter] = useState('')
    const [tagFilter, setTagFilter] = useState('')
    const [appConfig, setAppConfig] = useState({ buildings: [], food_tags: [] })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const ORDERS_PER_PAGE = 6

    useEffect(() => {
        api.get('/config').then(setAppConfig).catch(() => { })
    }, [])

    useEffect(() => {
        loadOrders(true)
        loadActivities()
        const interval = setInterval(() => {
            loadOrders(false)
            loadActivities()
        }, 5000)
        return () => clearInterval(interval)
    }, [filter, currentPage])

    // Reset pagination on filter or search change
    useEffect(() => {
        setCurrentPage(1)
    }, [filter, searchText, buildingFilter, tagFilter])

    async function loadActivities() {
        try {
            const data = await api.get('/activities')
            setActivities(data)
        } catch { /* noop */ }
    }

    async function loadOrders(showLoading = true) {
        if (showLoading) setLoading(true)
        try {
            const params = filter ? `?status=${filter}` : ''
            const data = await api.get(`/orders${params}`)
            setOrders(data)
        } catch {
            if (showLoading) setOrders([])
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    // Client-side filtering for search, building, and food tags (instant)
    const filteredOrders = useMemo(() => {
        let result = orders

        if (searchText.trim()) {
            const q = searchText.toLowerCase()
            result = result.filter(
                (o) =>
                    o.title?.toLowerCase().includes(q) ||
                    o.destination?.toLowerCase().includes(q) ||
                    o.building?.toLowerCase().includes(q) ||
                    o.creator?.display_name?.toLowerCase().includes(q)
            )
        }

        if (buildingFilter) {
            result = result.filter((o) => o.building === buildingFilter)
        }

        if (tagFilter) {
            result = result.filter((o) => o.food_tags?.includes(tagFilter))
        }

        return result
    }, [orders, searchText, buildingFilter, tagFilter])

    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * ORDERS_PER_PAGE
        return filteredOrders.slice(start, start + ORDERS_PER_PAGE)
    }, [filteredOrders, currentPage, ORDERS_PER_PAGE])

    const handleFeelingLucky = () => {
        const openOrders = orders.filter((o) => o.status === 'open')
        if (openOrders.length === 0) {
            addToast('No active orders to join right now!', 'error')
            return
        }
        const randomOrder = openOrders[Math.floor(Math.random() * openOrders.length)]
        navigate(`/order/${randomOrder.id}`)
    }

    return (
        <div className="home-page">
            {/* Activity Feed Sidebar (Now on the LEFT) */}
            <div className="home-sidebar-col">
                <div className="activity-feed">
                    <div className="activity-feed-header">
                        <h3>Activity</h3>
                    </div>
                    <div className="activity-list">
                        {activities.length === 0 && !loading ? (
                            <div className="activity-empty">Quiet right now...</div>
                        ) : (
                            activities.map((act) => (
                                <div key={act.id} className="activity-item">
                                    <div className="activity-text">
                                        <strong>{act.user?.display_name || 'Someone'}</strong> {act.message}
                                    </div>
                                    <div className="activity-time">
                                        {formatTimeAgo(act.created_at)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="home-main-col">
                <div className="home-header">
                    <div>
                        <h1 className="home-title">Order Board</h1>
                        <p className="home-subtitle">Join an existing order or start a new one</p>
                    </div>
                    <div className="home-actions" style={{ display: 'flex', gap: '12px' }}>
                        <Link to="/create-poll">
                            <Button variant="secondary">
                                <BarChart size={18} />
                                New Poll
                            </Button>
                        </Link>
                        <Link to="/create">
                            <Button variant="primary">
                                <PlusCircle size={18} />
                                New Order
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search bar */}
                <div className="search-bar-wrapper">
                    <Search size={16} className="search-bar-icon" />
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search orders by title, destination, building, or creator..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <button
                        className="feeling-lucky-btn"
                        onClick={handleFeelingLucky}
                        title="Jump to a random open order"
                    >
                        Can't choose?
                    </button>
                </div>

                {/* Filters row */}
                <div className="home-filters">
                    {/* Status chips */}
                    <div className="filter-row">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                className={`filter-chip ${filter === f.value ? 'active' : ''}`}
                                onClick={() => setFilter(f.value)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Building + Tag dropdowns */}
                    <div className="filter-dropdowns">
                        {appConfig.buildings.length > 0 && (
                            <select
                                className="filter-select"
                                value={buildingFilter}
                                onChange={(e) => setBuildingFilter(e.target.value)}
                            >
                                <option value="">All Buildings</option>
                                {appConfig.buildings.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        )}
                        {appConfig.food_tags.length > 0 && (
                            <select
                                className="filter-select"
                                value={tagFilter}
                                onChange={(e) => setTagFilter(e.target.value)}
                            >
                                <option value="">All Food Tags</option>
                                {appConfig.food_tags.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexShrink: 0 }}>
                    <ShoppingBag size={20} color="var(--text-primary)" />
                    <h2 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Orders</h2>
                </div>

                <div className="orders-grid-container">
                    {loading ? (
                        <div className="orders-grid">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="skeleton-card" />
                            ))}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <EmptyState
                            icon={<ShoppingBag size={36} />}
                            title={searchText || buildingFilter || tagFilter ? 'No matching orders' : 'No orders yet'}
                            description={
                                searchText || buildingFilter || tagFilter
                                    ? 'Try adjusting your filters or search query.'
                                    : 'Be the first to create a group order and save on delivery!'
                            }
                        >
                            {!searchText && !buildingFilter && !tagFilter && (
                                <Link to="/create">
                                    <Button variant="primary">
                                        <PlusCircle size={18} />
                                        Create First Order
                                    </Button>
                                </Link>
                            )}
                        </EmptyState>
                    ) : (
                        <>
                            <div className="orders-grid">
                                {paginatedOrders.map((order, i) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        style={{ animationDelay: `${i * 0.06}s` }}
                                    />
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
        </div>
    )
}

function formatTimeAgo(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 60) return 'Just now'
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
    return `${Math.floor(diffSecs / 86400)}d ago`
}
