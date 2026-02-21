import './Button.css'

export default function Button({
    children,
    variant = 'primary',
    size = '',
    block = false,
    loading = false,
    className = '',
    ...props
}) {
    const classes = [
        'btn',
        `btn-${variant}`,
        size && `btn-${size}`,
        block && 'btn-block',
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <button className={classes} disabled={loading || props.disabled} {...props}>
            {loading && <span className="btn-spinner" />}
            {children}
        </button>
    )
}
