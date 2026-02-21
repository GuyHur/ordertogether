import './EmptyState.css'

export default function EmptyState({ icon, title, description, children }) {
    return (
        <div className="empty-state">
            {icon && <div className="empty-state-icon">{icon}</div>}
            {title && <h3 className="empty-state-title">{title}</h3>}
            {description && <p className="empty-state-description">{description}</p>}
            {children}
        </div>
    )
}
