import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, ShoppingBag } from 'lucide-react'
import { api } from '../../services/api'
import OrderCard from '../../components/OrderCard/OrderCard'
import EmptyState from '../../components/EmptyState/EmptyState'
import Button from '../../components/Button/Button'
import './Home.css'

const STATUS_FILTERS = [
    { label: 'All', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Locked', value: 'locked' },
    { label: 'Ordered', value: 'ordered' },
    { label: 'Delivered', value: 'delivered' },
]

export default function Home() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

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

            {/* Filters */}
            <div className="home-filters">
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

            {/* Content */}
            {loading ? (
                <div className="orders-grid">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="skeleton-card" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <EmptyState
                    icon={<ShoppingBag size={36} />}
                    title="No orders yet"
                    description="Be the first to create a group order and save on delivery!"
                >
                    <Link to="/create">
                        <Button variant="primary">
                            <PlusCircle size={18} />
                            Create First Order
                        </Button>
                    </Link>
                </EmptyState>
            ) : (
                <div className="orders-grid">
                    {orders.map((order, i) => (
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
