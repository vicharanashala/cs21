import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Badge, EmptyState } from '../ui/GlassCard'
import { Plus, TrendingUp, Clock, Loader } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const API = '/api'
const token = () => localStorage.getItem('token')

export function SearchFailures({ isAdmin = false, refreshKey = 0 }) {
  const [failures, setFailures] = useState([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/analytics/search-failures`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      setFailures(data.failures || [])
    } catch {
      setFailures([])
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => { load() }, [load, refreshKey])

  const handleConvert = async (item) => {
    if (converting) return
    setConverting(item._id)
    try {
      await fetch(`${API}/analytics/search-failures/${item._id}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
      setFailures(prev => prev.filter(f => f._id !== item._id))
      navigate('/chat', { state: { question: item.query } })
    } catch {
      // ignore
    } finally {
      setConverting(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[12px] text-gray-400">Admin only</p>
      </div>
    )
  }

  if (loading) return <FailuresSkeleton />

  if (failures.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={TrendingUp} title="No unresolved failures" description="All failed searches addressed." compact />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1">
      {failures.map((item, i) => (
        <motion.div
          key={item._id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate leading-snug">
              "{item.query}"
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400">{item.count}× failed</span>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(item.lastSearched), { addSuffix: true })}</span>
            </div>
          </div>
          <button
            onClick={() => handleConvert(item)}
            disabled={converting === item._id}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
          >
            {converting === item._id
              ? <><Loader size={9} className="animate-spin" /></>
              : <><Plus size={10} /> FAQ</>}
          </button>
        </motion.div>
      ))}
    </div>
  )
}

function FailuresSkeleton() {
  return (
    <div className="flex-1 space-y-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2 animate-pulse">
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}