import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, ShoppingBag } from 'lucide-react'
import { api } from '../../services/api'
import OrderCard from '../../components/OrderCard/OrderCard'
import EmptyState from '../../components/EmptyState/EmptyState'
import Button from '../../components/Button/Button'
import './MyOrders.css'

export default function MyOrders() {
    const [data, setData] = useState({ created: [], joined: [] })
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('created')

    useEffect(() => {
        loadMyOrders(true)
        const interval = setInterval(() => loadMyOrders(false), 5000)
        return () => clearInterval(interval)
    }, [])

    async function loadMyOrders(showLoading = true) {
        if (showLoading) setLoading(true)
        try {
            const result = await api.get('/orders/mine')
            setData(result)
        } catch {
            // handle err if needed
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    const orders = tab === 'created' ? data.created : data.joined

    return (
        <div className="myorders-page">
            <h1 className="page-title">My Orders</h1>

            <div className="myorders-tabs">
                <button
                    className={`myorders-tab ${tab === 'created' ? 'active' : ''}`}
                    onClick={() => setTab('created')}
                >
                    Created
                    <span className="tab-count">{data.created.length}</span>
                </button>
                <button
                    className={`myorders-tab ${tab === 'joined' ? 'active' : ''}`}
                    onClick={() => setTab('joined')}
                >
                    Joined
                    <span className="tab-count">{data.joined.length}</span>
                </button>
            </div>

            {loading ? (
                <div className="orders-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton-card" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <EmptyState
                    icon={<ShoppingBag size={36} />}
                    title={tab === 'created' ? 'No orders created' : 'No orders joined'}
                    description={
                        tab === 'created'
                            ? 'Start a group order and invite your team!'
                            : 'Browse the order board and join an existing order.'
                    }
                >
                    <Link to={tab === 'created' ? '/create' : '/'}>
                        <Button variant="primary">
                            <PlusCircle size={18} />
                            {tab === 'created' ? 'Create Order' : 'Browse Orders'}
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
