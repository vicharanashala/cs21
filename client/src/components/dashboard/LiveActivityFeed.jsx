import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, Avatar, Badge } from '../ui/GlassCard'
import { Activity, Zap, UserPlus, MessageSquare, CheckCircle, Shield, ArrowUp, MessageCircle, RefreshCw } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const typeConfig = {
  faq_created: { icon: '📝', label: 'New FAQ', color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  ai_response: { icon: '🤖', label: 'AI Response', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  user_signup: { icon: '👋', label: 'User Joined', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  admin_action: { icon: '🛡️', label: 'Admin Action', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  issue_resolved: { icon: '✅', label: 'Issue Resolved', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  faq_voted: { icon: '⬆️', label: 'FAQ Upvoted', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  comment_added: { icon: '💬', label: 'Comment Added', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const prevCountRef = useRef(0)
  const wsRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    loadActivities()

    // Socket.io connection
    try {
      const { io } = window._socketIo || {}
      if (io) {
        const socket = io('http://localhost:5001', { transports: ['websocket'] })
        wsRef.current = socket
        socket.on('connect', () => setConnected(true))
        socket.on('disconnect', () => setConnected(false))
        socket.on('activity', (event) => {
          setActivities(prev => [event, ...prev].slice(0, 30))
          setNewCount(c => c + 1)
        })
      }
    } catch {
      // Socket.io not available, fall back to polling
      const interval = setInterval(loadActivities, 15000)
      return () => clearInterval(interval)
    }

    return () => { wsRef.current?.disconnect() }
  }, [])

  const loadActivities = () => {
    fetch(`${API}/activity`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => {
        setActivities(d.activities || [])
        if (d.activities?.length > prevCountRef.current) {
          setNewCount(d.activities.length - prevCountRef.current)
        }
        prevCountRef.current = d.activities?.length || 0
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setNewCount(0)
  }

  return (
    <GlassCard className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={18} className={connected ? 'text-emerald-500' : 'text-gray-400'} />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Live Activity</h2>
          {connected && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">Live</span>
            </span>
          )}
        </div>
        {newCount > 0 && (
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors"
          >
            <RefreshCw size={10} /> {newCount} new
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No recent activity
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {activities.map((activity, i) => {
              const config = typeConfig[activity.type] || typeConfig.faq_created
              const isNew = i < newCount
              return (
                <motion.div
                  key={activity._id || `${activity.type}-${i}`}
                  initial={isNew ? { opacity: 0, y: -12, scale: 0.95 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                    isNew ? 'bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className={`w-7 h-7 ${config.bg} rounded-full flex items-center justify-center shrink-0 text-sm`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-200 leading-snug">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.user?.name?.split(' ')[0] || 'System'} · {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                  {isNew && (
                    <span className="w-2 h-2 bg-brand-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  )
}

function formatTimeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}