import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, Badge, Avatar, EmptyState } from '../ui/GlassCard'
import { SearchX, Plus, TrendingUp, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const API = '/api'
const token = () => localStorage.getItem('token')

const mockFailures = [
  { _id: '1', query: 'how to implement dark mode in material ui', count: 14, lastSearched: new Date(Date.now() - 1000 * 60 * 30) },
  { _id: '2', query: 'best react state management library 2026', count: 11, lastSearched: new Date(Date.now() - 1000 * 60 * 60) },
  { _id: '3', query: 'kubernetes autoscaling not working', count: 9, lastSearched: new Date(Date.now() - 1000 * 60 * 90) },
  { _id: '4', query: 'postgresql deadlock resolution', count: 7, lastSearched: new Date(Date.now() - 1000 * 60 * 120) },
  { _id: '5', query: 'how to train llama 3 locally', count: 6, lastSearched: new Date(Date.now() - 1000 * 60 * 150) },
]

export function SearchFailures({ isAdmin = false }) {
  const [failures, setFailures] = useState([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(null)

  useEffect(() => {
    // Try API first, fall back to mock
    fetch(`${API}/analytics/search-failures`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setFailures(d.failures || []))
      .catch(() => setFailures(mockFailures))
      .finally(() => setLoading(false))
  }, [])

  const handleConvert = async (item) => {
    setConverting(item._id)
    await new Promise(r => setTimeout(r, 800))
    setFailures(prev => prev.filter(f => f._id !== item._id))
    setConverting(null)
    // In production: navigate to FAQ creation with pre-filled question
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SearchX size={18} className="text-red-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Search Failure Analytics</h2>
        </div>
        <Badge variant="danger">🔴 {failures.length} failed</Badge>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-12" />
            </div>
          ))}
        </div>
      ) : failures.length === 0 ? (
        <EmptyState icon={SearchX} title="No search failures" description="All searches are resolving successfully!" />
      ) : (
        <div className="space-y-2">
          {failures.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  "{item.query}"
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                    <TrendingUp size={10} /> {item.count} searches
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                    <Clock size={10} /> {formatDistanceToNow(new Date(item.lastSearched), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleConvert(item)}
                  disabled={converting === item._id}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                >
                  <Plus size={12} /> Convert
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}