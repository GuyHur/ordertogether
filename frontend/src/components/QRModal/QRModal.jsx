import { QRCodeCanvas } from 'qrcode.react'
import { Link2 } from 'lucide-react'
import Modal from '../Modal/Modal'
import './QRModal.css'

const WOLT_BASE_URL = 'https://wolt.com/group/'
const QR_SIZE = 400

export default function QRModal({ groupOrderId, onClose }) {
    const fullUrl = `${WOLT_BASE_URL}${groupOrderId}`

    return (
        <Modal title="Scan to Join Order" onClose={onClose}>
            <div className="qr-modal-content">
                <div className="qr-modal-url">
                    <Link2 size={14} style={{ flexShrink: 0 }} />
                    {fullUrl}
                </div>

                <div className="qr-modal-canvas">
                    <QRCodeCanvas
                        value={fullUrl}
                        size={QR_SIZE}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#0f1225"
                    />
                </div>
            </div>
        </Modal>
    )
}
