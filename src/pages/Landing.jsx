import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogIn, Shield, Zap, Lock } from 'lucide-react'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [recentRooms, setRecentRooms] = useState([])
  const [liveRooms, setLiveRooms] = useState(0)
  const [itemsShared, setItemsShared] = useState(0)

  useEffect(() => {
    // Load recent rooms from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('portal-recent-rooms') || '[]')
      setRecentRooms(stored.slice(0, 5))
    } catch { /* ignore */ }
  }, [])

  // Fetch real live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setLiveRooms(data.activeRooms)
        setItemsShared(data.itemsSharedToday)
      } catch { /* ignore */ }
    }
    
    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  const createRoom = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/rooms', { method: 'POST' })
      const data = await res.json()
      saveRecentRoom(data.code)
      navigate(`/room/${data.code}`)
    } catch (err) {
      console.error('Failed to create room:', err)
      setCreating(false)
    }
  }

  const joinRoom = (e) => {
    e.preventDefault()
    const code = joinCode.trim().toLowerCase()
    if (!code) return
    saveRecentRoom(code)
    navigate(`/room/${code}`)
  }

  const saveRecentRoom = (code) => {
    try {
      let rooms = JSON.parse(localStorage.getItem('portal-recent-rooms') || '[]')
      rooms = rooms.filter(r => r.code !== code)
      rooms.unshift({ code, lastVisited: Date.now() })
      rooms = rooms.slice(0, 10)
      localStorage.setItem('portal-recent-rooms', JSON.stringify(rooms))
    } catch { /* ignore */ }
  }

  const formatRecentTime = (timestamp) => {
    const diff = Date.now() - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  return (
    <main className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <img src="/portal-icon.svg" alt="Portal" className="landing-icon" />
        <h1 className="landing-title">
          <span className="gradient-text">Portal</span>
        </h1>
        <p className="landing-subtitle">
          Share <strong>text, links, passwords & files</strong> between your
          devices instantly. No sign-up. No app install. Just open & share.
        </p>
      </section>

      {/* Action Cards */}
      <section className="landing-actions">
        {/* Create Room */}
        <div className="action-card glass" id="create-room-card">
          <div className="action-icon">
            <Plus strokeWidth={2.5} />
          </div>
          <h3>Create Room</h3>
          <p>Start a new private room and share the code with your other device</p>
          <div className="live-stats">
            <div className="live-stat">
              <span className="live-dot" />
              <span className="live-stat-number">{liveRooms.toLocaleString()}</span>
              <span className="live-stat-label">rooms active now</span>
            </div>
            <div className="live-stat">
              <span className="live-stat-icon">📋</span>
              <span className="live-stat-number">{itemsShared.toLocaleString()}</span>
              <span className="live-stat-label">items shared today</span>
            </div>
          </div>
          <button
            className="btn btn-primary action-btn"
            id="create-room-btn"
            onClick={createRoom}
            disabled={creating}
          >
            {creating ? 'Creating…' : 'Create New Room'}
          </button>
        </div>

        {/* Join Room */}
        <div className="action-card glass" id="join-room-card">
          <div className="action-icon">
            <LogIn strokeWidth={2.5} />
          </div>
          <h3>Join Room</h3>
          <p>Enter the code shown on your other device to start sharing</p>
          <form className="join-form" onSubmit={joinRoom}>
            <input
              type="text"
              className="input-field join-code-input"
              id="join-code-input"
              placeholder="e.g. swift-eagle-42"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="submit"
              className="btn btn-primary action-btn"
              id="join-room-btn"
              disabled={!joinCode.trim()}
            >
              Join Room
            </button>
          </form>
        </div>
      </section>

      {/* Recent Rooms */}
      {recentRooms.length > 0 && (
        <section className="recent-rooms">
          <h4>Recent Rooms</h4>
          <div className="recent-list">
            {recentRooms.map((room) => (
              <div
                key={room.code}
                className="recent-item"
                onClick={() => {
                  saveRecentRoom(room.code)
                  navigate(`/room/${room.code}`)
                }}
              >
                <span className="recent-item-code">{room.code}</span>
                <span className="recent-item-time">{formatRecentTime(room.lastVisited)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <div className="landing-badges">
        <div className="badge">
          <Lock size={16} />
          <span>End-to-end encrypted</span>
        </div>
        <div className="badge">
          <Shield size={16} />
          <span>No data stored</span>
        </div>
        <div className="badge">
          <Zap size={16} />
          <span>Instant transfer</span>
        </div>
      </div>
    </main>
  )
}
