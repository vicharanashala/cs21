import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, Badge, EmptyState, ProgressBar } from '../ui/GlassCard'
import { TrendingUp, Tag, Zap } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function RisingTopics() {
  const [rising, setRising] = useState([])
  const [topTags, setTopTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/analytics/rising-topics`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => {
        setRising(d.rising || [])
        setTopTags(d.topTags || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const maxGrowth = Math.max(...rising.map(r => r.growth), 1)

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Rising Topics</h2>
        </div>
        <Badge variant="success">🔥 Live</Badge>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full" />
            </div>
          ))}
        </div>
      ) : rising.length === 0 && topTags.length === 0 ? (
        <EmptyState icon={Zap} title="Collecting data..." description="Topics will appear as activity grows." />
      ) : (
        <div className="space-y-5">
          {/* Growth by category */}
          {rising.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Category Growth</h3>
              <div className="space-y-3">
                {rising.slice(0, 5).map((item, i) => {
                  const barWidth = (item.growth / maxGrowth) * 100
                  const isUp = item.growth >= 0
                  return (
                    <motion.div
                      key={item.category}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isUp ? '+' : ''}{item.growth}%
                          </span>
                          <span className="text-xs text-gray-400">({item.current} FAQs)</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${isUp ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top keywords */}
          {topTags.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                <Tag size={12} /> Trending Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {topTags.map((item, i) => (
                  <motion.div
                    key={item.tag}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm hover:border-brand-200 dark:hover:border-brand-800 transition-colors cursor-default"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">#{item.tag}</span>
                    <span className="text-xs text-gray-400">×{item.count}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}