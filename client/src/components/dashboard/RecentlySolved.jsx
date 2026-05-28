import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassCard, Badge, Avatar } from '../ui/GlassCard'
import { CheckCircle, ArrowRight } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function RecentlySolved({ initialData = null }) {
  const [faqs, setFaqs] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) { setLoading(false); return }
    fetch(`${API}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setFaqs(d.solvedFAQs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialData])

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recently Solved</h2>
        </div>
        <Link to="/faqs?sort=popular" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          </div>
        ))}</div>
      ) : !faqs?.length ? (
        <p className="text-sm text-gray-400 text-center py-6">No solved FAQs yet.</p>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq._id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/faqs/${faq._id}`}
                className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors -mx-3"
              >
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">{faq.question}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="success">✅ Solved</Badge>
                    <Badge variant="default">{faq.category}</Badge>
                    <span className="text-xs text-gray-400">{faq.votes} votes</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}