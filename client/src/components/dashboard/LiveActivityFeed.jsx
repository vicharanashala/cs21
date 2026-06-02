import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, RefreshCw } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const typeConfig = {
  faq_created:    { icon: '📝', accent: 'var(--accent)',    bg: 'var(--accent-dim)'    },
  ai_response:    { icon: '🤖', accent: '#A78BFA',          bg: 'rgba(167,139,250,0.12)' },
  user_signup:    { icon: '👋', accent: 'var(--success)',   bg: 'var(--success-dim)'  },
  admin_action:   { icon: '🛡️', accent: 'var(--warning)',   bg: 'var(--warning-dim)'  },
  issue_resolved: { icon: '✅', accent: 'var(--success)',   bg: 'var(--success-dim)'  },
  faq_voted:      { icon: '⬆️', accent: 'var(--info)',      bg: 'var(--info-dim)'      },
  comment_added:  { icon: '💬', accent: '#7C5CFC',          bg: 'var(--accent-dim)'    },
}

export function LiveActivityFeed({ refreshKey = 0 }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [connected, setConnected]   = useState(false)
  const [newCount, setNewCount]     = useState(0)
  const scrollRef = useRef(null)
  const wsRef     = useRef(null)
  const countRef  = useRef(0)

  const loadActivities = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/activity`, { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      const fresh = data.activities || []
      setActivities(prev => {
        const existing = new Set(prev.map(a => a._id))
        const added    = fresh.filter(a => !existing.has(a._id))
        countRef.current += added.length
        setNewCount(countRef.current)
        return [...added.reverse(), ...prev].slice(0, 30)
      })
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    countRef.current = 0; setNewCount(0)
    loadActivities()
    const poll = setInterval(loadActivities, 15_000)
    return () => clearInterval(poll)
  }, [loadActivities, refreshKey])

  useEffect(() => {
    try {
      const { io } = window._socketIo || {}
      if (!io) return
      const socket = io('http://localhost:5001', { transports: ['websocket'] })
      wsRef.current = socket
      socket.on('connect', () => setConnected(true))
      socket.on('disconnect', () => setConnected(false))
      socket.on('activity', (event) => {
        setActivities(prev => [event, ...prev].slice(0, 30))
        countRef.current++
        setNewCount(countRef.current)
      })
      return () => socket.disconnect()
    } catch { /* WebSocket not available */ }
  }, [])

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    countRef.current = 0; setNewCount(0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, paddingBottom: 10,
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity
            size={13}
            style={{ color: connected ? 'var(--success)' : 'var(--text-3)' }}
          />
          {connected && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: 'var(--success)', display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.07em',
                color: 'var(--success)',
              }}>
                LIVE
              </span>
            </span>
          )}
        </div>
        {newCount > 0 && (
          <button
            onClick={scrollToTop}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              background: 'var(--accent-dim)', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, color: 'var(--accent)',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px var(--accent-dim)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
          >
            <RefreshCw size={9} /> {newCount} new
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 2,
          paddingRight: 2,
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 6px', borderRadius: 10,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--surface-2)', flexShrink: 0,
                  animation: 'shimmer 1.8s infinite',
                  backgroundImage: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
                  backgroundSize: '200% 100%',
                }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{
                    height: 10, borderRadius: 4,
                    background: 'var(--surface-2)', animation: 'shimmer 1.8s infinite',
                    backgroundImage: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
                    backgroundSize: '200% 100%',
                  }} />
                  <div style={{
                    height: 8, width: '35%', borderRadius: 4,
                    background: 'var(--surface-2)', animation: 'shimmer 1.8s infinite',
                    backgroundImage: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
                    backgroundSize: '200% 100%',
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No activity yet</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {activities.map((activity, i) => {
              const cfg  = typeConfig[activity.type] || typeConfig.faq_created
              const isNew = i < newCount
              return (
                <motion.div
                  key={activity._id || `${activity.type}-${i}`}
                  initial={isNew ? { opacity: 0, y: -6, scale: 0.97 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    padding: '7px 6px', borderRadius: 10,
                    background: isNew ? 'var(--accent-dim)' : 'transparent',
                    transition: 'background 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    if (!isNew) e.currentTarget.style.background = 'var(--surface-2)'
                  }}
                  onMouseLeave={e => {
                    if (!isNew) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {/* Icon bubble */}
                  <div style={{
                    width: 30, height: 30,
                    borderRadius: '50%',
                    background: cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 13,
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, fontWeight: 500,
                      color: 'var(--text)', lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {activity.description}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                      {activity.user?.name?.split(' ')[0] || 'System'} · {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>

                  {/* New dot */}
                  {isNew && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent)', flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function formatTimeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60)    return `${Math.floor(diff)}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}