import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
    ArrowLeft, Users, MapPin, Clock, ExternalLink,
    Calendar, UserPlus, UserMinus, LogOut as LeaveIcon, Trash2 as TrashIcon, QrCode,
    Share2, Building, Check, Copy, Link2, Plus, MessageCircle, Send, Upload, FileImage, RefreshCw
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast/Toast'
import Button from '../../components/Button/Button'
import CountdownTimer from '../../components/CountdownTimer/CountdownTimer'
import Modal from '../../components/Modal/Modal'
import QRModal from '../../components/QRModal/QRModal'
import Avatar from '../../components/Avatar/Avatar'
import { getServiceIcon } from '../../utils/getIcon'
import '../auth.css'
import './OrderDetail.css'

const STATUS_FLOW = ['open', 'invite_only', 'locked', 'ordered', 'delivered']

export default function OrderDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const { addToast } = useToast()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const inviteToken = searchParams.get('invite')

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joinNote, setJoinNote] = useState('')
    const [joinItems, setJoinItems] = useState('')
    const [inviteCode, setInviteCode] = useState(inviteToken || '')
    const [joining, setJoining] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const [invites, setInvites] = useState([])
    const [creatingInvite, setCreatingInvite] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)

    // Chat
    const [comments, setComments] = useState([])
    const [commentBody, setCommentBody] = useState('')
    const [sendingComment, setSendingComment] = useState(false)

    // Receipts
    const [receipts, setReceipts] = useState([])
    const [uploadingReceipt, setUploadingReceipt] = useState(false)

    // Modals
    const [confirmAction, setConfirmAction] = useState(null)

    const loadOrder = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
        try {
            const data = await api.get(`/orders/${id}`)
            setOrder(data)
        } catch {
            if (showLoading) {
                addToast('Order not found', 'error')
                navigate('/')
            }
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [id, addToast, navigate])

    useEffect(() => {
        loadOrder(true)
        const interval = setInterval(() => loadOrder(false), 5000)
        return () => clearInterval(interval)
    }, [loadOrder])

    const isCreator = user?.id === order?.creator?.id

    // Load invite links if creator
    const loadInvites = useCallback(async () => {
        if (!isCreator || order?.status !== 'invite_only') return
        try {
            const data = await api.get(`/orders/${id}/invites`)
            setInvites(data)
        } catch { setInvites([]) }
    }, [id, isCreator, order?.status])

    useEffect(() => { loadInvites() }, [loadInvites])

    // Load comments polling
    const loadComments = useCallback(async () => {
        try {
            const data = await api.get(`/orders/${id}/comments`)
            setComments(data)
        } catch { /* noop */ }
    }, [id])

    useEffect(() => {
        loadComments()
        const interval = setInterval(loadComments, 5000)
        return () => clearInterval(interval)
    }, [loadComments])

    // Load receipts
    const loadReceipts = useCallback(async () => {
        try {
            const data = await api.get(`/orders/${id}/receipts`)
            setReceipts(data)
        } catch { /* noop */ }
    }, [id])

    useEffect(() => { loadReceipts() }, [loadReceipts])

    const handleDownload = async (receiptId, filename) => {
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/orders/${id}/receipts/${receiptId}/download`, {
                headers: { ...(token && { Authorization: `Bearer ${token}` }) }
            })
            if (!res.ok) throw new Error("Download failed")

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            a.remove()
        } catch (err) {
            addToast("Error downloading receipt", "error")
        }
    }

    const handleDeleteReceipt = (receiptId, filename) => {
        setConfirmAction({
            title: 'Delete Receipt',
            message: `Are you sure you want to permanently delete the receipt "${filename}"?`,
            onConfirm: async () => {
                setConfirmAction(null)
                try {
                    await api.delete(`/orders/${id}/receipts/${receiptId}`)
                    addToast('Receipt deleted', 'info')
                    await loadReceipts()
                } catch (err) {
                    addToast(err.message, 'error')
                }
            }
        })
    }

    if (loading) return (
        <div className="detail-page">
            <div className="skeleton-card" style={{ height: 400 }} />
        </div>
    )
    if (!order) return null

    const isParticipant = order.participants?.some((p) => p.user?.id === user?.id)
    const canJoin = !isParticipant && (
        order.status === 'open' ||
        order.status === 'invite_only'
    )

    const handleJoin = async (e) => {
        e.preventDefault()
        setJoining(true)
        try {
            const data = await api.post(`/orders/${id}/join`, {
                note: joinNote || null,
                items_summary: joinItems || null,
                invite_token: inviteCode || null,
            })
            setOrder(data)
            setJoinNote('')
            setJoinItems('')
            addToast('You joined the order!', 'success')
        } catch (err) {
            addToast(err.message, 'error')
        } finally {
            setJoining(false)
        }
    }

    const handleCreateInvite = async (maxUses = null) => {
        setCreatingInvite(true)
        try {
            await api.post(`/orders/${id}/invites`, { max_uses: maxUses })
            addToast('Invite link created!', 'success')
            await loadInvites()
        } catch (err) {
            addToast(err.message, 'error')
        } finally {
            setCreatingInvite(false)
        }
    }

    const handleCopyInvite = async (token) => {
        const url = `${window.location.origin}/order/${id}?invite=${token}`
        try {
            await navigator.clipboard.writeText(url)
            addToast('Invite link copied!', 'success')
        } catch {
            addToast('Failed to copy link', 'error')
        }
    }

    const handleRevokeInvite = async (inviteId) => {
        try {
            await api.delete(`/orders/${id}/invites/${inviteId}`)
            addToast('Invite revoked', 'info')
            await loadInvites()
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const handleLeave = async () => {
        try {
            await api.delete(`/orders/${id}/leave`)
            await loadOrder()
            addToast('You left the order', 'info')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const handleKick = (participantId) => {
        setConfirmAction({
            title: 'Remove Participant',
            message: 'Are you sure you want to remove this user from the order?',
            onConfirm: async () => {
                setConfirmAction(null)
                try {
                    await api.delete(`/orders/${id}/participants/${participantId}`)
                    addToast('Participant removed', 'info')
                    await loadOrder()
                } catch (err) {
                    addToast(err.message, 'error')
                }
            }
        })
    }

    const handleStatusChange = async (newStatus) => {
        try {
            const data = await api.put(`/orders/${id}/status`, { status: newStatus })
            setOrder(data)
            addToast(`Order status changed to ${newStatus}`, 'success')
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const handleDelete = () => {
        setConfirmAction({
            title: 'Cancel Order',
            message: 'Are you sure you want to cancel this order?',
            onConfirm: async () => {
                setConfirmAction(null)
                try {
                    await api.delete(`/orders/${id}`)
                    addToast('Order cancelled', 'info')
                    navigate('/')
                } catch (err) {
                    addToast(err.message, 'error')
                }
            }
        })
    }

    const formatDate = (d) => {
        if (!d) return '—'
        return new Date(d).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        })
    }

    return (
        <div className="detail-page">
            <Link to="/" className="detail-back">
                <ArrowLeft size={16} /> Back to orders
            </Link>

            <div className="detail-card">
                {/* Header */}
                <div className="detail-card-header">
                    <div className="detail-card-header-left">
                        <img
                            src={getServiceIcon(order.service?.icon_url)}
                            alt={order.service?.name}
                            className="detail-service-icon"
                        />
                        <div>
                            <h1 className="detail-title">{order.title}</h1>
                            <div className="detail-service-name">
                                {order.service?.name_he || order.service?.name}
                            </div>
                        </div>
                    </div>
                    <div className="detail-actions">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                navigate('/create', {
                                    state: {
                                        service_id: order.service?.id,
                                        title: order.title,
                                        description: order.description,
                                        destination: order.destination,
                                        building: order.building,
                                        location_note: order.location_note,
                                        food_tags: order.food_tags
                                    }
                                })
                            }}
                        >
                            <RefreshCw size={16} />
                            Reorder
                        </Button>
                        {order.group_order_id && (isParticipant || isCreator) && (
                            <Button variant="ghost" size="sm" onClick={() => setShowQR(true)}>
                                <QrCode size={16} />
                                QR Code
                            </Button>
                        )}
                        {isCreator && ['open', 'invite_only', 'locked', 'ordered'].includes(order.status) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const url = `${window.location.origin}/order/${order.id}`
                                    navigator.clipboard.writeText(url)
                                        .then(() => {
                                            setLinkCopied(true)
                                            addToast('Invite link copied to clipboard!', 'success')
                                            setTimeout(() => setLinkCopied(false), 2500)
                                        })
                                        .catch(() => addToast('Failed to copy link', 'error'))
                                }}
                            >
                                {linkCopied ? <Check size={16} /> : <Share2 size={16} />}
                                {linkCopied ? 'Copied!' : 'Share Link'}
                            </Button>
                        )}
                        <span className={`order-status ${order.status}`}>
                            {order.status === 'invite_only' ? 'invite only' : order.status}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="detail-body">
                    {/* External link */}
                    {order.order_link && (
                        <a
                            href={order.order_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="order-link-card"
                        >
                            <ExternalLink size={14} />
                            Open shared cart
                        </a>
                    )}

                    {/* Meta grid */}
                    <div className="detail-meta-grid">
                        <div className="detail-meta-item">
                            <div className="detail-meta-icon"><Users size={16} /></div>
                            <div>
                                <div className="detail-meta-label">Participants</div>
                                <div className="detail-meta-value">{order.participants?.length || 0} people</div>
                            </div>
                        </div>
                        {order.destination && (
                            <div className="detail-meta-item">
                                <div className="detail-meta-icon"><MapPin size={16} /></div>
                                <div>
                                    <div className="detail-meta-label">Destination</div>
                                    <div className="detail-meta-value">{order.destination}</div>
                                </div>
                            </div>
                        )}
                        {order.deadline && (
                            <div className="detail-meta-item">
                                <div className="detail-meta-icon"><Clock size={16} /></div>
                                <div>
                                    <div className="detail-meta-label">Deadline</div>
                                    <div className="detail-meta-value">
                                        {order.status === 'open' ? (
                                            <CountdownTimer deadline={order.deadline} />
                                        ) : (
                                            formatDate(order.deadline)
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="detail-meta-item">
                            <div className="detail-meta-icon"><Calendar size={16} /></div>
                            <div>
                                <div className="detail-meta-label">Created</div>
                                <div className="detail-meta-value">{formatDate(order.created_at)}</div>
                            </div>
                        </div>
                        {order.building && (
                            <div className="detail-meta-item">
                                <div className="detail-meta-icon"><Building size={16} /></div>
                                <div>
                                    <div className="detail-meta-label">Building</div>
                                    <div className="detail-meta-value">
                                        {order.building}
                                        {order.location_note && (
                                            <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 4 }}>
                                                — {order.location_note}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Food tags */}
                    {order.food_tags && order.food_tags.length > 0 && (
                        <div className="detail-food-tags">
                            {order.food_tags.map((tag) => (
                                <span key={tag} className="detail-food-tag">{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    {order.description && (
                        <div className="detail-description">{order.description}</div>
                    )}

                    {/* Creator controls */}
                    {isCreator && (
                        <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginRight: '8px' }}>
                                Change status:
                            </span>
                            <div className="status-selector">
                                {STATUS_FLOW.map((s) => (
                                    <Button
                                        key={s}
                                        variant={order.status === s ? 'primary' : 'ghost'}
                                        size="sm"
                                        onClick={() => handleStatusChange(s)}
                                        disabled={order.status === s}
                                    >
                                        {s.replace('_', ' ')}
                                    </Button>
                                ))}
                            </div>
                            <Button variant="danger" size="sm" onClick={handleDelete}>
                                <TrashIcon size={14} /> Cancel
                            </Button>
                        </div>
                    )}

                    {/* Participants */}
                    <div className="detail-section-title">
                        <Users size={18} />
                        Participants ({order.participants?.length || 0})
                    </div>

                    <div className="participants-list">
                        {order.participants?.map((p) => {
                            return (
                                <div key={p.id} className="participant-row">
                                    <Avatar user={p.user} className="participant-avatar" />
                                    <div className="participant-info">
                                        <div className="participant-name">{p.user?.display_name}</div>
                                        {(p.note || p.items_summary) && (
                                            <div className="participant-note">
                                                {p.items_summary && <span>{p.items_summary}</span>}
                                                {p.items_summary && p.note && <span> · </span>}
                                                {p.note && <span>{p.note}</span>}
                                            </div>
                                        )}
                                    </div>
                                    {p.user?.id === order.creator?.id ? (
                                        <span className="participant-badge">Creator</span>
                                    ) : isCreator && (
                                        <Button variant="ghost" size="sm" onClick={() => handleKick(p.user?.id)} style={{ color: 'var(--accent-danger)' }}>
                                            <UserMinus size={13} style={{ marginRight: 4 }} /> Kick
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Join form */}
                    {canJoin && (
                        <form className="join-form" onSubmit={handleJoin}>
                            <div className="join-form-title">
                                <UserPlus size={14} style={{ display: 'inline', marginRight: 6 }} />
                                Join this order
                            </div>
                            {order.status === 'invite_only' && (
                                <div className="form-group">
                                    <label className="form-label" htmlFor="join-invite-code">Invite Code</label>
                                    <input
                                        id="join-invite-code"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. xYz123"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label" htmlFor="join-items">What are you ordering?</label>
                                <input
                                    id="join-items"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Chicken shawarma, fries"
                                    value={joinItems}
                                    onChange={(e) => setJoinItems(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="join-note">Note (optional)</label>
                                <input
                                    id="join-note"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. No onions please"
                                    value={joinNote}
                                    onChange={(e) => setJoinNote(e.target.value)}
                                />
                            </div>
                            <Button type="submit" variant="success" loading={joining}>
                                <UserPlus size={16} /> Join Order
                            </Button>
                        </form>
                    )}

                    {/* Leave button */}
                    {/* Invite management (creator, invite_only) */}
                    {isCreator && order.status === 'invite_only' && (
                        <div className="invite-section">
                            <div className="detail-section-title">
                                <Link2 size={18} />
                                Invite Links
                            </div>
                            <div className="invite-actions">
                                <Button variant="primary" size="sm" onClick={() => handleCreateInvite(null)} loading={creatingInvite}>
                                    <Plus size={14} /> Unlimited Use Link
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleCreateInvite(1)} loading={creatingInvite}>
                                    <Plus size={14} /> Single Use Link
                                </Button>
                            </div>
                            {invites.length > 0 && (
                                <div className="invite-list">
                                    {invites.map((inv) => (
                                        <div key={inv.id} className="invite-row">
                                            <div className="invite-token">{inv.token}</div>
                                            <div className="invite-meta">
                                                {inv.max_uses ? `${inv.use_count}/${inv.max_uses} uses` : `${inv.use_count} uses`}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleCopyInvite(inv.token)}>
                                                <Copy size={13} /> Copy
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleRevokeInvite(inv.id)}>
                                                <TrashIcon size={13} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {isParticipant && !isCreator && ['open', 'invite_only'].includes(order.status) && (
                        <div style={{ marginTop: 'var(--space-xl)' }}>
                            <Button variant="danger" size="sm" onClick={handleLeave}>
                                <LeaveIcon size={14} /> Leave Order
                            </Button>
                        </div>
                    )}

                    {/* Receipt Upload (creator) */}
                    {isCreator && (
                        <div className="detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                            <div className="detail-section-title">
                                <FileImage size={18} />
                                Receipts
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                                <label className="receipt-upload-btn">
                                    <Upload size={14} />
                                    {uploadingReceipt ? 'Uploading…' : 'Upload Receipt'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            setUploadingReceipt(true)
                                            try {
                                                const fd = new FormData()
                                                fd.append('file', file)
                                                await api.upload(`/orders/${id}/receipts`, fd)
                                                addToast('Receipt uploaded!', 'success')
                                                await loadReceipts()
                                            } catch (err) {
                                                addToast(err.message, 'error')
                                            } finally {
                                                setUploadingReceipt(false)
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            {receipts.map(r => (
                                <div key={r.id} className="receipt-row">
                                    <span className="receipt-name">{r.filename}</span>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                                        <button onClick={() => handleDownload(r.id, r.filename)} className="receipt-download">
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDeleteReceipt(r.id, r.filename)}
                                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent-danger)' }}
                                            title="Delete Receipt"
                                        >
                                            <TrashIcon size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Receipts list for participants */}
                    {!isCreator && receipts.length > 0 && (
                        <div className="detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                            <div className="detail-section-title">
                                <FileImage size={18} />
                                Receipts
                            </div>
                            {receipts.map(r => (
                                <div key={r.id} className="receipt-row">
                                    <span className="receipt-name">{r.filename}</span>
                                    <button onClick={() => handleDownload(r.id, r.filename)} className="receipt-download">
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Chat / Comments */}
                    {(isParticipant || isCreator) && (
                        <div className="detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                            <div className="detail-section-title">
                                <MessageCircle size={18} />
                                Chat ({comments.length})
                            </div>
                            <div className="chat-messages">
                                {comments.length === 0 && (
                                    <div className="chat-empty">No messages yet. Say something!</div>
                                )}
                                {comments.map(c => (
                                    <div key={c.id} className={`chat-message ${c.user?.id === user?.id ? 'own' : ''}`}>
                                        <div className="chat-message-header">
                                            <span className="chat-author">{c.user?.display_name}</span>
                                            <span className="chat-time">
                                                {new Date(c.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="chat-body">{c.body}</div>
                                    </div>
                                ))}
                            </div>
                            <form className="chat-input-row" onSubmit={async (e) => {
                                e.preventDefault()
                                if (!commentBody.trim() || sendingComment) return
                                setSendingComment(true)
                                try {
                                    await api.post(`/orders/${id}/comments`, { body: commentBody.trim() })
                                    setCommentBody('')
                                    await loadComments()
                                } catch (err) {
                                    addToast(err.message, 'error')
                                } finally {
                                    setSendingComment(false)
                                }
                            }}>
                                <input
                                    type="text"
                                    className="form-input chat-input"
                                    placeholder="Type a message…"
                                    value={commentBody}
                                    onChange={(e) => setCommentBody(e.target.value)}
                                />
                                <Button type="submit" variant="primary" size="sm" loading={sendingComment}>
                                    <Send size={14} />
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Code modal */}
            {showQR && order.group_order_id && (
                <QRModal
                    groupOrderId={order.group_order_id}
                    onClose={() => setShowQR(false)}
                />
            )}

            {/* Confirmation modal */}
            {confirmAction && (
                <Modal
                    title={confirmAction.title}
                    onClose={() => setConfirmAction(null)}
                    footer={
                        <>
                            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
                            <Button variant="danger" onClick={confirmAction.onConfirm}>OK</Button>
                        </>
                    }
                >
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{confirmAction.message}</p>
                </Modal>
            )}
        </div>
    )
}
