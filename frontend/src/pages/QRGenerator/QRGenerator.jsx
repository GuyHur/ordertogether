import { useState, useRef, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Link2, Download, Copy, QrCode, Check } from 'lucide-react'
import { useToast } from '../../components/Toast/Toast'
import Button from '../../components/Button/Button'
import './QRGenerator.css'

const WOLT_BASE_URL = 'https://wolt.com/group/'
const QR_SIZE = 400
const QR_ERROR_CORRECTION = 'H' // High — most resilient

export default function QRGenerator() {
    const [groupId, setGroupId] = useState('')
    const [copied, setCopied] = useState(false)
    const canvasRef = useRef(null)
    const { addToast } = useToast()

    const trimmedId = groupId.trim().toUpperCase()
    const fullUrl = trimmedId ? `${WOLT_BASE_URL}${trimmedId}` : ''

    /* ── Download QR as PNG ────────────────────────────────────────────── */
    const handleDownload = useCallback(() => {
        const wrapper = canvasRef.current
        if (!wrapper) return

        const canvas = wrapper.querySelector('canvas')
        if (!canvas) return

        const link = document.createElement('a')
        link.download = `wolt-group-${trimmedId}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        addToast('QR code downloaded!', 'success')
    }, [trimmedId, addToast])

    /* ── Copy URL to clipboard ─────────────────────────────────────────── */
    const handleCopy = useCallback(async () => {
        if (!fullUrl) return
        try {
            await navigator.clipboard.writeText(fullUrl)
            setCopied(true)
            addToast('Link copied to clipboard!', 'success')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            addToast('Failed to copy', 'error')
        }
    }, [fullUrl, addToast])

    return (
        <div className="qr-page">
            <h1 className="page-title">QR Code Generator</h1>
            <p className="page-subtitle">
                Generate a scannable QR code for any Wolt group order
            </p>

            <div className="qr-card">
                {/* Input */}
                <div className="qr-input-row">
                    <div className="qr-input-prefix">wolt.com/group/</div>
                    <input
                        type="text"
                        className="qr-input-field"
                        placeholder="e.g. 7PNCEZM9"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                        autoFocus
                        id="qr-group-id-input"
                    />
                </div>

                {/* URL preview */}
                {fullUrl && (
                    <div className="qr-url-preview">
                        <Link2 size={14} style={{ flexShrink: 0 }} />
                        {fullUrl}
                    </div>
                )}

                {/* QR code or empty state */}
                {fullUrl ? (
                    <div className="qr-display">
                        <div className="qr-canvas-wrapper" ref={canvasRef}>
                            <QRCodeCanvas
                                value={fullUrl}
                                size={QR_SIZE}
                                level={QR_ERROR_CORRECTION}
                                includeMargin={false}
                                bgColor="#ffffff"
                                fgColor="#0f1225"
                            />
                        </div>

                        <div className="qr-actions">
                            <Button variant="primary" onClick={handleDownload}>
                                <Download size={16} />
                                Download PNG
                            </Button>
                            <Button variant="ghost" onClick={handleCopy}>
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy Link'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="qr-empty">
                        <div className="qr-empty-icon">
                            <QrCode size={36} />
                        </div>
                        <p className="qr-empty-text">
                            Enter a Wolt Group ID above to generate a scannable QR code instantly
                        </p>
                    </div>
                )}

                {/* Hint */}
                <div className="qr-hint">
                    <strong>💡 Tip:</strong> You can find the Group ID in your Wolt group
                    order link. For example, in{' '}
                    <code style={{ color: 'var(--text-accent)' }}>
                        wolt.com/group/<strong>7PNCEZM9</strong>
                    </code>{' '}
                    the ID is <strong>7PNCEZM9</strong>. The QR code is generated entirely
                    on your device — nothing is sent to any server.
                </div>
            </div>
        </div>
    )
}
