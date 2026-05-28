import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { GlassCard, Badge, Avatar, EmptyState } from '../ui/GlassCard'
import { Clock, ArrowRight, BookOpen } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function RecentFAQs({ initialData = null }) {
  const [faqs, setFaqs] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) return
    fetch(`${API}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setFaqs(d.recentFAQs))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false))
  }, [initialData])

  if (loading) return <RecentFAQSkeleton />

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🕐</span>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Most Recent FAQs</h2>
        </div>
        <Link to="/faqs?sort=newest" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      {!faqs?.length ? (
        <EmptyState icon={BookOpen} title="No FAQs yet" description="Be the first to add a FAQ!" />
      ) : (
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Link
                to={`/faqs/${faq._id}`}
                className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors -mx-3"
              >
                <Avatar name={faq.user?.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                    {faq.question}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="default">{faq.category}</Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(faq.createdAt), { addSuffix: true })}
                    </span>
                    <span className="text-xs text-gray-400">by {faq.user?.name?.split(' ')[0]}</span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {faq.isAI && <Badge variant="ai">🤖 AI</Badge>}
                  <span className="text-xs text-gray-400">{faq.votes} ↑</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

export function RecentFAQSkeleton() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🕐</span>
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 -mx-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}