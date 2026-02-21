import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/services')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(setServices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading…</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <main className="page">
      <h1 className="title">OrderTogether</h1>
      <p className="subtitle">Order together from your favorite delivery apps</p>
      <div className="icons">
        {services.map((service) => (
          <a
            key={service.id}
            href={service.site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-card"
            aria-label={service.name_he || service.name}
          >
            <img
              src={service.icon_url}
              alt=""
              width={64}
              height={64}
              className="icon-img"
            />
            <span className="icon-name">{service.name_he || service.name}</span>
          </a>
        ))}
      </div>
    </main>
  )
}

export default App
