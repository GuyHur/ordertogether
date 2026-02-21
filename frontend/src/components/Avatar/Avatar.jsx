import React from 'react'

export default function Avatar({ user, className = '', style = {} }) {
    if (!user) {
        return <div className={className} style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>?</div>
    }

    const initial = user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'
    const avatarUrl = user.avatar_url
    const bgColor = user.avatar_color || 'var(--accent-primary)'

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={user.display_name}
                className={className}
                style={{ objectFit: 'cover', ...style }}
            />
        )
    }

    return (
        <div
            className={className}
            style={{ backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', ...style }}
        >
            {initial}
        </div>
    )
}
