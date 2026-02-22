import { Link } from 'react-router-dom'
import { Users, MapPin, Clock, Building } from 'lucide-react'
import CountdownTimer from '../CountdownTimer/CountdownTimer'
import Avatar from '../Avatar/Avatar'
import { getServiceIcon } from '../../utils/getIcon'
import './OrderCard.css'

export default function OrderCard({ order, style }) {
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
                        src={getServiceIcon(order.service?.icon_url)}
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
                <span className={`order-status ${order.status}`}>
                    {order.status === 'invite_only' ? 'invite only' : order.status}
                </span>
            </div>

            {/* Tags row */}
            {(order.building || (order.food_tags && order.food_tags.length > 0)) && (
                <div className="order-card-tags">
                    {order.building && (
                        <span className="order-card-building-tag">
                            <Building size={11} />
                            {order.building}
                        </span>
                    )}
                    {order.food_tags?.map((tag) => (
                        <span key={tag} className="order-card-food-tag">{tag}</span>
                    ))}
                </div>
            )}

            {/* Meta */}
            <div className="order-card-meta">
                <div className="order-card-creator">
                    <Avatar user={order.creator} className="order-card-avatar" />
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
