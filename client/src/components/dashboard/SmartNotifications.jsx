import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, X, RefreshCw, Shield, Bot, TrendingUp, AlertTriangle, FileText, Info, Link2 } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const NOTIF_ICONS = {
  duplicate:  <Link2 size={14} />,
  spam:       <Shield size={14} />,
  ai:         <Bot size={14} />,
  trending:   <TrendingUp size={14} />,
  info:       <Info size={14} />,
  faq:        <FileText size={14} />,
  warning:    <AlertTriangle size={14} />,
}

const VARIANT_COLORS = {
  warning: { border: '#FBBF24', bg: 'rgba(251,191,36,0.06)', icon: '#FBBF24', iconBg: 'rgba(251,191,36,0.12)' },
  danger:  { border: '#F87171', bg: 'rgba(248,113,113,0.06)', icon: '#F87171', iconBg: 'rgba(248,113,113,0.12)' },
  purple:  { border: '#7C5CFC', bg: 'rgba(124,92,252,0.06)', icon: '#7C5CFC', iconBg: 'rgba(124,92,252,0.12)' },
  success: { border: '#34D399', bg: 'rgba(52,211,153,0.06)', icon: '#34D399', iconBg: 'rgba(52,211,153,0.12)' },
  info:    { border: '#38BDF8', bg: 'rgba(56,189,248,0.06)', icon: '#38BDF8', iconBg: 'rgba(56,189,248,0.12)' },
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-3.5 animate-pulse"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-4)' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full shrink-0" style={{ background: 'var(--surface-4)' }} />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 rounded" style={{ background: 'var(--surface-4)', width: '60%' }} />
          <div className="h-2.5 rounded" style={{ background: 'var(--surface-3)', width: '85%' }} />
        </div>
      </div>
    </div>
  )
}

function NotificationCard({ notif, index, onDismiss }) {
  const colors = VARIANT_COLORS[notif.variant] || VARIANT_COLORS.info
  const icon = NOTIF_ICONS[notif.type] || <Bell size={14} />

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.04,
      }}
      layout
      className="group relative rounded-xl cursor-pointer overflow-hidden"
      style={{
        background: colors.bg,
        border: `1px solid var(--surface-4)`,
        borderLeft: `3px solid ${colors.border}`,
      }}
      whileHover={{ x: 3 }}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Icon bubble */}
        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
          style={{ background: colors.iconBg, color: colors.icon }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className="text-sm font-semibold leading-tight"
              style={{ color: 'var(--text)' }}
            >
              {notif.title}
            </p>
            <span
              className="text-xs shrink-0 mt-0.5"
              style={{ color: 'var(--text-3)' }}
            >
              {notif.time}
            </span>
          </div>
          <p
            className="text-xs mt-1 leading-snug line-clamp-2"
            style={{ color: 'var(--text-2)' }}
          >
            {notif.message}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(notif.id) }}
          className="opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-opacity duration-150 hover:bg-white/10"
          style={{ color: 'var(--text-3)' }}
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  )
}

export function SmartNotifications({ refreshKey = 0 }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [showAll, setShowAll]             = useState(false)
  const [dismissed, setDismissed]         = useState(new Set())
  const [connected, setConnected]         = useState(false)
  const pollRef   = useRef(null)
  const esRef     = useRef(null)

  const loadNotifications = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      setNotifications(prev => {
        const existing = new Set(prev.map(n => n.id))
        const fresh    = (data.notifications || []).filter(n => !existing.has(n.id))
        return [...fresh, ...prev].slice(0, 50)
      })
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadNotifications()
    pollRef.current = setInterval(loadNotifications, 30_000)
    return () => clearInterval(pollRef.current)
  }, [loadNotifications, refreshKey])

  useEffect(() => {
    const es = new EventSource(`http://localhost:5001/api/notifications/stream?token=${token()}`)
    esRef.current = es
    es.onopen  = () => setConnected(true)
    es.onerror = () => setConnected(false)
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'activity' && Array.isArray(data.notifications)) {
          setNotifications(prev => {
            const existing = new Set(prev.map(n => n.id))
            const fresh    = data.notifications.filter(n => !existing.has(n.id))
            return [...fresh, ...prev].slice(0, 50)
          })
        }
      } catch { /* ignore */ }
    }
    return () => { es.close(); setConnected(false) }
  }, [])

  const unread      = notifications.filter(n => !n.read && !dismissed.has(n.id))
  const visible     = showAll
    ? notifications.filter(n => !dismissed.has(n.id))
    : unread.slice(0, 5)
  const activeCount = notifications.filter(n => !dismissed.has(n.id)).length

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const dismiss     = (id) => setDismissed(prev => new Set([...prev, id]))

  return (
    <div className="flex flex-col min-h-0">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            {connected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--success)' }} />
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>Live</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--text-3)' }} />
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>Connecting…</span>
              </>
            )}
          </div>

          {/* Unread badge */}
          {unread.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-white text-xs font-bold"
              style={{ background: 'var(--danger)' }}
            >
              {unread.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'var(--accent)' }}
            >
              <RefreshCw size={11} />
              Mark all read
            </button>
          )}
          {loading && <RefreshCw size={13} className="animate-spin" style={{ color: 'var(--text-3)' }} />}
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: 420 }}>
        {loading && notifications.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'var(--surface-3)' }}
            >
              <BellOff size={22} style={{ color: 'var(--text-3)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>All caught up!</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>No new notifications</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((notif, i) => (
              <NotificationCard
                key={notif.id}
                notif={notif}
                index={i}
                onDismiss={dismiss}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Show more / less */}
      {activeCount > 5 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="shrink-0 mt-3 w-full text-center text-xs font-medium py-2.5 rounded-xl transition-colors"
          style={{
            color: 'var(--accent)',
            background: 'var(--surface-2)',
            border: '1px solid var(--surface-4)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
        >
          {showAll ? 'Show less' : `View ${activeCount - 5} more`}
        </button>
      )}
    </div>
  )
}