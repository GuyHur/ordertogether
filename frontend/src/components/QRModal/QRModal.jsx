import { useRef, useCallback, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Link2, Download, Copy, Check } from 'lucide-react'
import Modal from '../Modal/Modal'
import Button from '../Button/Button'
import './QRModal.css'

const WOLT_BASE_URL = 'https://wolt.com/group/'
const QR_SIZE = 400

export default function QRModal({ groupOrderId, onClose }) {
    const canvasRef = useRef(null)
    const [copied, setCopied] = useState(false)
    const fullUrl = `${WOLT_BASE_URL}${groupOrderId}`

    const handleDownload = useCallback(() => {
        const canvas = canvasRef.current?.querySelector('canvas')
        if (!canvas) return
        const link = document.createElement('a')
        link.download = `wolt-group-${groupOrderId}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }, [groupOrderId])

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(fullUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { /* fallback silently */ }
    }, [fullUrl])

    return (
        <Modal title="Scan to Join Order" onClose={onClose}>
            <div className="qr-modal-content">
                <div className="qr-modal-url">
                    <Link2 size={14} style={{ flexShrink: 0 }} />
                    {fullUrl}
                </div>

                <div className="qr-modal-canvas" ref={canvasRef}>
                    <QRCodeCanvas
                        value={fullUrl}
                        size={QR_SIZE}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#0f1225"
                    />
                </div>

                <div className="qr-modal-actions">
                    <Button variant="primary" size="sm" onClick={handleDownload}>
                        <Download size={15} />
                        Download PNG
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                </div>

                <p className="qr-modal-hint">
                    Generated locally — nothing is sent to any server
                </p>
            </div>
        </Modal>
    )
}
