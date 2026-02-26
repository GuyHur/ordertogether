import { useState, useEffect } from 'react'
import { parseZonedDateTime } from '../../utils/date'

export default function CountdownTimer({ deadline }) {
    const [remaining, setRemaining] = useState('')

    useEffect(() => {
        function update() {
            const diff = parseZonedDateTime(deadline) - Date.now()
            if (diff <= 0) {
                setRemaining('Expired')
                return
            }

            const hours = Math.floor(diff / 3600000)
            const mins = Math.floor((diff % 3600000) / 60000)
            const secs = Math.floor((diff % 60000) / 1000)

            if (hours > 0) {
                setRemaining(`${hours}h ${mins}m`)
            } else if (mins > 0) {
                setRemaining(`${mins}m ${secs}s`)
            } else {
                setRemaining(`${secs}s`)
            }
        }

        update()
        const id = setInterval(update, 1000)
        return () => clearInterval(id)
    }, [deadline])

    return <span>{remaining}</span>
}
