import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '../ui/GlassCard'
import { Activity, RefreshCw } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const typeConfig = {
  faq_created:    { icon: '📝', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  ai_response:    { icon: '🤖', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  user_signup:    { icon: '👋', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  admin_action:   { icon: '🛡️', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  issue_resolved: { icon: '✅', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  faq_voted:      { icon: '⬆️', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  comment_added:  { icon: '💬', bg: 'bg-blue-50 dark:bg-blue-900/20' },
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

  // Initial load + 15s polling fallback
  useEffect(() => {
    countRef.current = 0; setNewCount(0)
    loadActivities()
    const poll = setInterval(loadActivities, 15_000)
    return () => clearInterval(poll)
  }, [loadActivities, refreshKey])

  // WebSocket real-time (supplements polling)
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
    <div className="flex flex-col h-full min-h-0">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity size={13} className={connected ? 'text-emerald-500' : 'text-gray-400'} />
          {connected && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-semibold">Live</span>
            </span>
          )}
        </div>
        {newCount > 0 && (
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-600 text-white text-[10px] font-semibold hover:bg-brand-700 transition-colors"
          >
            <RefreshCw size={9} /> {newCount} new
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl animate-pulse">
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-[12px]">
            No activity yet
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {activities.map((activity, i) => {
              const cfg  = typeConfig[activity.type] || typeConfig.faq_created
              const isNew = i < newCount
              return (
                <motion.div
                  key={activity._id || `${activity.type}-${i}`}
                  initial={isNew ? { opacity: 0, y: -8, scale: 0.97 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors ${
                    isNew ? 'bg-brand-50/60 dark:bg-brand-900/15' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <div className={`w-7 h-7 ${cfg.bg} rounded-full flex items-center justify-center shrink-0 text-sm`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-700 dark:text-gray-200 leading-snug line-clamp-2">
                      {activity.description}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {activity.user?.name?.split(' ')[0] || 'System'} · {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                  {isNew && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full shrink-0 mt-1.5" />}
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
  if (diff < 60)   return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}