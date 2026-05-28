import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassCard, Badge, Avatar, EmptyState } from '../ui/GlassCard'
import { TrendingUp, Eye, ArrowUp, CheckCircle, Flame } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function PopularFAQs({ initialData = null }) {
  const [faqs, setFaqs] = useState(initialData)
  const [sortBy, setSortBy] = useState('views')
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    fetch(`${API}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setFaqs(d.popularFAQs))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false))
  }, [])

  const sortOptions = [
    { key: 'views', label: 'Most Viewed' },
    { key: 'votes', label: 'Most Voted' },
    { key: 'interactions', label: 'AI Interactions' },
  ]

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Popular FAQs</h2>
        </div>
        <div className="flex gap-1">
          {sortOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                sortBy === opt.key
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!faqs?.length ? (
        <EmptyState icon={Flame} title="No popular FAQs yet" description="Start getting votes to appear here!" />
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const popularityScore = sortBy === 'views' ? faq.views : faq.votes
            const maxScore = Math.max(...faqs.map(f => sortBy === 'views' ? f.views : f.votes))
            const barWidth = maxScore > 0 ? (popularityScore / maxScore) * 100 : 0
            const isSolved = faq.votes >= 5

            return (
              <motion.div
                key={faq._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/faqs/${faq._id}`}
                  className="group block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors -mx-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="text-xs font-bold text-gray-300 dark:text-gray-600">#{i + 1}</span>
                      {isSolved && <CheckCircle size={14} className="text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 flex-1">
                          {faq.question}
                        </p>
                        {faq.isAI && <Badge variant="ai">🤖 AI</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="default">{faq.category}</Badge>
                        {isSolved && <Badge variant="success">✅ Solved</Badge>}
                      </div>
                      {/* Popularity bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                          <span className="flex items-center gap-0.5"><Eye size={10} />{faq.views}</span>
                          <span className="flex items-center gap-0.5"><ArrowUp size={10} />{faq.votes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}