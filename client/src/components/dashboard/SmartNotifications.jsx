import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, X, RefreshCw } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const icons = {
  duplicate: '🔗', spam: '🛡️', ai: '🤖',
  trending: '📈', info: 'ℹ️', faq: '📝', warning: '⚠️',
}

const variantStyles = {
  warning: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10',
  danger:  'border-red-50 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10',
  purple:  'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10',
  success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10',
  info:    'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10',
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

  // Initial load + 30s polling
  useEffect(() => {
    loadNotifications()
    pollRef.current = setInterval(loadNotifications, 30_000)
    return () => clearInterval(pollRef.current)
  }, [loadNotifications, refreshKey])

  // SSE real-time stream
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

  const unread     = notifications.filter(n => !n.read && !dismissed.has(n.id))
  const visible    = showAll
    ? notifications.filter(n => !dismissed.has(n.id))
    : unread.slice(0, 4)
  const activeCount = notifications.filter(n => !dismissed.has(n.id)).length

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const dismiss     = (id) => setDismissed(prev => new Set([...prev, id]))

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Bell size={13} className={connected ? 'text-amber-500' : 'text-gray-400'} />
          {connected && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-semibold">Live</span>
            </span>
          )}
          {unread.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {unread.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              <RefreshCw size={9} /> Mark all read
            </button>
          )}
          {loading && <RefreshCw size={12} className="text-gray-400 animate-spin" />}
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {loading && notifications.length === 0 ? (
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <BellOff size={28} className="text-gray-200 dark:text-gray-700" />
            <p className="text-[12px]">All caught up!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className={`p-2.5 rounded-xl border transition-colors ${variantStyles[notif.variant] || ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm shrink-0 mt-0.5">{icons[notif.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(notif.id)}
                    className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 shrink-0 mt-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Show more */}
      {activeCount > 4 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="shrink-0 mt-2 text-center text-[11px] text-brand-600 hover:text-brand-700 font-semibold py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          {showAll ? 'Show less' : `View ${activeCount - 4} more`}
        </button>
      )}
    </div>
  )
}