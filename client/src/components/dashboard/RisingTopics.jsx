import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EmptyState } from '../ui/GlassCard'
import { Tag } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function RisingTopics({ refreshKey = 0 }) {
  const [rising, setRising]   = useState([])
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
  }, [refreshKey])

  if (loading) return <RisingTopicsSkeleton />

  if (rising.length === 0 && topTags.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState icon={Tag} title="No activity yet" description="Topics grow as users add FAQs." compact />
      </div>
    )
  }

  const maxGrowth = Math.max(...rising.map(r => r.growth), 1)

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Category growth */}
      {rising.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rising.slice(0, 5).map((item, i) => {
            const isUp = item.growth >= 0
            const barWidth = Math.max(4, (item.growth / maxGrowth) * 100)
            return (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{item.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: isUp ? '#059669' : '#DC2626',
                    }}>
                      {isUp ? '+' : ''}{item.growth}%
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>({item.current})</span>
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 2,
                      background: isUp ? '#10B981' : '#EF4444',
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Trending tags */}
      {topTags.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Tag size={10} style={{ color: 'var(--text-3)' }} />
            <span style={{
              fontSize: 9, fontWeight: 600, color: 'var(--text-3)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Trending
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {topTags.map((item, i) => (
              <motion.span
                key={item.tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 6,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  fontSize: 11, color: 'var(--text-2)',
                  cursor: 'default',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>#</span>
                {item.tag}
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>×{item.count}</span>
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RisingTopicsSkeleton() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ height: 10, width: 70, background: 'var(--surface-2)', borderRadius: 3 }} />
            <div style={{ height: 10, width: 45, background: 'var(--surface-2)', borderRadius: 3 }} />
          </div>
          <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2 }} />
        </div>
      ))}
    </div>
  )
}