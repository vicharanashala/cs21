import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge, ConfidenceBar, EmptyState } from '../ui/GlassCard'
import { Check, Edit3, X, Loader } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function AISuggestedAnswers({ refreshKey = 0 }) {
  const [suggestions, setSuggestions] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/analytics/search-failures`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      const top = (data.failures || []).slice(0, 4)
      setSuggestions(top.map(f => ({
        id: f._id,
        question: f.query,
        category: 'General',
        confidence: Math.max(30, 100 - f.count * 5),
        answer: 'Draft answer — click Refine to write or Create to add as-is.',
        failureCount: f.count,
      })))
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const handleCreate = async (item) => {
    setActionLoading(item.id)
    try {
      const res = await fetch(`${API}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ question: item.question, answer: item.answer, category: item.category }),
      })
      if (res.ok) setSuggestions(prev => prev.filter(s => s.id !== item.id))
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefine = (item) => {
    navigate('/chat', { state: { question: item.question } })
  }

  if (loading) return <AISuggestedSkeleton />

  if (!suggestions.length) {
    return (
      <div className="flex items-center justify-center py-6">
        <EmptyState icon={Check} title="All caught up" description="No pending suggestions." compact />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 max-h-80">
      {suggestions.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div
            className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                  {item.question}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <Badge variant="default">{item.category}</Badge>
                  {item.failureCount && (
                    <span className="text-[10px] text-gray-400">{item.failureCount}× failed</span>
                  )}
                </div>
                <div className="mt-2">
                  <ConfidenceBar confidence={item.confidence} />
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSuggestions(prev => prev.filter(s => s.id !== item.id)) }}
                className="text-gray-300 hover:text-gray-500 shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {expandedId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-2.5 space-y-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.answer}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreate(item)}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoading === item.id
                        ? <><Loader size={10} className="animate-spin" /> Creating…</>
                        : <><Check size={10} /> Create FAQ</>}
                    </button>
                    <button
                      onClick={() => handleRefine(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit3 size={10} /> Refine
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

function AISuggestedSkeleton() {
  return (
    <div className="space-y-2 max-h-80 overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
        </div>
      ))}
    </div>
  )
}