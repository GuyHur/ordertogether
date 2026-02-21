import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, ShoppingBag, Search } from 'lucide-react'
import { api } from '../../services/api'
import OrderCard from '../../components/OrderCard/OrderCard'
import EmptyState from '../../components/EmptyState/EmptyState'
import Button from '../../components/Button/Button'
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
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [searchText, setSearchText] = useState('')
    const [buildingFilter, setBuildingFilter] = useState('')
    const [tagFilter, setTagFilter] = useState('')
    const [appConfig, setAppConfig] = useState({ buildings: [], food_tags: [] })

    useEffect(() => {
        api.get('/config').then(setAppConfig).catch(() => { })
    }, [])

    useEffect(() => {
        loadOrders()
    }, [filter])

    async function loadOrders() {
        setLoading(true)
        try {
            const params = filter ? `?status=${filter}` : ''
            const data = await api.get(`/orders${params}`)
            setOrders(data)
        } catch {
            setOrders([])
        } finally {
            setLoading(false)
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

    return (
        <div className="home-page">
            <div className="home-header">
                <div>
                    <h1 className="home-title">Order Board</h1>
                    <p className="home-subtitle">Join an existing order or start a new one</p>
                </div>
                <Link to="/create">
                    <Button variant="primary">
                        <PlusCircle size={18} />
                        New Order
                    </Button>
                </Link>
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

            {/* Content */}
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
                <div className="orders-grid">
                    {filteredOrders.map((order, i) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            style={{ animationDelay: `${i * 0.06}s` }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
