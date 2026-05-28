import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, Badge } from '../ui/GlassCard'
import { Bell, BellOff, AlertTriangle, Shield, Sparkles, TrendingUp, X } from 'lucide-react'

const initialNotifications = [
  { id: '1', type: 'duplicate', title: 'Duplicate Detected', message: 'Question "How to train CNNs" is 89% similar to an existing FAQ', time: '5m ago', read: false, variant: 'warning' },
  { id: '2', type: 'spam', title: 'Spam Alert', message: '3 suspicious FAQs flagged from new user for review', time: '12m ago', read: false, variant: 'danger' },
  { id: '3', type: 'ai', title: 'Low AI Confidence', message: 'FAQ draft "Postgres sharding" has 61% confidence — needs review', time: '28m ago', read: false, variant: 'purple' },
  { id: '4', type: 'trending', title: 'Trending Topic', message: '"RAG pipelines" is surging — 3x more searches this hour', time: '1h ago', read: true, variant: 'success' },
  { id: '5', type: 'ai', title: 'New AI Suggestion', message: 'Draft answer ready for "How to implement dark mode in Tailwind"', time: '2h ago', read: true, variant: 'purple' },
]

const icons = { duplicate: '🔗', spam: '🛡️', ai: '🤖', trending: '📈' }
const variantStyles = {
  warning: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10',
  danger: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10',
  purple: 'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10',
  success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10',
}

export function SmartNotifications() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [showAll, setShowAll] = useState(false)
  const [dismissed, setDismissed] = useState(new Set())

  const unread = notifications.filter(n => !n.read && !dismissed.has(n.id))
  const display = showAll ? notifications.filter(n => !dismissed.has(n.id)) : unread.slice(0, 3)

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-amber-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Smart Notifications</h2>
          {unread.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">{unread.length}</span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            Mark all read
          </button>
        )}
      </div>

      {display.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center gap-2">
          <BellOff size={32} className="text-gray-200 dark:text-gray-700" />
          <p>All caught up! No new notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {display.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className={`p-3 rounded-xl border transition-colors ${variantStyles[notif.variant] || ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">{icons[notif.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                      <span className="text-xs text-gray-400 shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                  <button
                    onClick={() => setDismissed(prev => new Set([...prev, notif.id]))}
                    className="text-gray-300 hover:text-gray-500 shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {notifications.filter(n => !dismissed.has(n.id)).length > 3 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="w-full mt-3 text-center text-xs text-brand-600 hover:text-brand-700 font-medium py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          {showAll ? 'Show less' : `View ${notifications.filter(n => !dismissed.has(n.id)).length - 3} more`}
        </button>
      )}
    </GlassCard>
  )
}