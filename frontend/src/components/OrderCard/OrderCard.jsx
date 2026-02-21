import { Link } from 'react-router-dom'
import { Users, MapPin, Clock } from 'lucide-react'
import CountdownTimer from '../CountdownTimer/CountdownTimer'
import './OrderCard.css'

export default function OrderCard({ order, style }) {
    const initials = order.creator?.display_name
        ?.split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'

    const isUrgent =
        order.deadline &&
        order.status === 'open' &&
        new Date(order.deadline) - Date.now() < 15 * 60 * 1000 // <15 min

    return (
        <Link to={`/order/${order.id}`} className="order-card" style={style}>
            {/* Header */}
            <div className="order-card-header">
                <div className="order-card-info">
                    <img
                        src={order.service?.icon_url}
                        alt={order.service?.name}
                        className="order-card-service-icon"
                    />
                    <div>
                        <div className="order-card-title">{order.title}</div>
                        <div className="order-card-service">
                            {order.service?.name_he || order.service?.name}
                        </div>
                    </div>
                </div>
                <span className={`order-status ${order.status}`}>{order.status}</span>
            </div>

            {/* Meta */}
            <div className="order-card-meta">
                <div className="order-card-creator">
                    <div
                        className="order-card-avatar"
                        style={{ backgroundColor: order.creator?.avatar_color || '#63b3ed' }}
                    >
                        {initials}
                    </div>
                    <span className="order-card-meta-item">
                        {order.creator?.display_name}
                    </span>
                </div>

                <div className="order-card-meta-item">
                    <Users size={14} />
                    {order.participant_count} joined
                </div>

                {order.destination && (
                    <div className="order-card-meta-item">
                        <MapPin size={14} />
                        {order.destination}
                    </div>
                )}

                {order.deadline && order.status === 'open' && (
                    <div className={`order-card-meta-item ${isUrgent ? 'deadline-urgent' : ''}`}>
                        <Clock size={14} />
                        <CountdownTimer deadline={order.deadline} />
                    </div>
                )}
            </div>
        </Link>
    )
}
